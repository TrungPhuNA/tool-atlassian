const axios = require('axios');
const jiraService = require('./jira.service');
const jiraConfigRepository = require('../repositories/jira-config.repository');
const jiraIssueRepository = require('../repositories/jira-issue.repository');
const { SyncJob, JiraIssue } = require('../models');

class SyncService {
  async triggerSync() {
    const config = await jiraConfigRepository.getConfig();
    if (!config) throw new Error('Chưa cấu hình Jira');

    // Tạo job ở trạng thái pending
    const job = await SyncJob.create({
      status: 'pending',
      started_at: new Date()
    });

    // Chạy tiến trình đồng bộ trong background
    this.processSync(job.id, config).catch(err => {
      console.error(`[SyncService] Background sync failed for Job ${job.id}:`, err);
    });

    return job;
  }

  async processSync(jobId, config) {
    const { jira_domain, jira_email, api_token } = config;
    const job = await SyncJob.findByPk(jobId);
    
    try {
      await job.update({ status: 'running' });

      console.log(`[SyncService] Job ${jobId}: Fetching all boards...`);
      const boards = await jiraService.getAllBoards(jira_domain, jira_email, api_token);
      await job.update({ total_boards: boards.length });

      let newCount = 0;
      let updatedCount = 0;
      const syncedKeys = new Set();

      for (let i = 0; i < boards.length; i++) {
        // Kiểm tra xem job có bị yêu cầu dừng không
        const currentJob = await SyncJob.findByPk(jobId);
        if (currentJob.status === 'stopped') {
          console.log(`[SyncService] Job ${jobId} was manually stopped.`);
          return;
        }

        const board = boards[i];
// ... (giữ nguyên phần còn lại của loop)
        console.log(`[SyncService] Job ${jobId}: Syncing Board ${i + 1}/${boards.length}: ${board.name}`);
        
        let startAt = 0;
        const maxResults = 50;

        while (true) {
          const data = await jiraService.getIssuesByBoard(jira_domain, jira_email, api_token, board.id, startAt, maxResults);
          if (!data.issues || data.issues.length === 0) break;

          for (const issue of data.issues) {
            if (!syncedKeys.has(issue.key)) {
              const result = await this.saveIssue(issue, jira_domain);
              if (result.isNew) newCount++;
              else updatedCount++;
              
              syncedKeys.add(issue.key);
            }
          }

          startAt += maxResults;
          if (startAt >= data.total) break;
        }

        // Cập nhật tiến độ sau mỗi board
        await job.update({
          synced_boards: i + 1,
          new_issues_count: newCount,
          updated_issues_count: updatedCount
        });
      }

      await job.update({
        status: 'completed',
        completed_at: new Date()
      });
      console.log(`[SyncService] Job ${jobId} completed. New: ${newCount}, Updated: ${updatedCount}`);

    } catch (err) {
      console.error(`[SyncService] Job ${jobId} failed:`, err);
      await job.update({
        status: 'failed',
        error_message: err.message,
        completed_at: new Date()
      });
    }
  }

  async saveIssue(jiraIssue, jira_domain) {
    const fields = jiraIssue.fields;
    
    const issueData = {
      issue_key: jiraIssue.key,
      issue_type: fields.issuetype?.name,
      summary: fields.summary,
      status: fields.status?.name,
      assignee_id: fields.assignee?.accountId,
      assignee_name: fields.assignee?.displayName,
      assignee_avatar: fields.assignee?.avatarUrls?.['48x48'],
      priority: fields.priority?.name,
      start_date: fields.created,
      due_date: fields.duedate,
      end_date: fields.duedate,
      sprint_name: fields.sprint?.name || fields.customfield_10020?.[0]?.name,
      story_points: fields.customfield_10016 || fields.customfield_10002 || fields.customfield_10106 || fields.customfield_10047,
      has_description: !!fields.description,
      has_story_points: !!(fields.customfield_10016 || fields.customfield_10002 || fields.customfield_10106 || fields.customfield_10047),
      has_due_date: !!fields.duedate,
      jira_domain: jira_domain,
      jira_data: jiraIssue,
      last_sync_at: new Date()
    };

    if (fields.parent) {
      const parentKey = fields.parent.key;
      const parentLocal = await jiraIssueRepository.upsert({
        issue_key: parentKey,
        summary: fields.parent.fields?.summary || 'Parent Task',
        issue_type: fields.parent.fields?.issuetype?.name || 'Task',
        status: fields.parent.fields?.status?.name || 'Unknown'
      });
      issueData.parent_id = parentLocal.id;
    }

    const [issue, created] = await JiraIssue.findOrCreate({
      where: { issue_key: issueData.issue_key },
      defaults: issueData
    });

    if (!created) {
      await issue.update(issueData);
    }

    return { issue, isNew: created };
  }

  async stopJob(jobId) {
    const job = await SyncJob.findByPk(jobId);
    if (job && job.status === 'running') {
      await job.update({ status: 'stopped', completed_at: new Date() });
      return true;
    }
    return false;
  }

  async deleteJob(jobId) {
    const job = await SyncJob.findByPk(jobId);
    if (job) {
      await job.destroy();
      return true;
    }
    return false;
  }

  async getSyncHistory(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return SyncJob.findAndCountAll({
      order: [['created_at', 'DESC']],
      limit,
      offset
    });
  }

  async getLatestJob() {
    return SyncJob.findOne({
      order: [['created_at', 'DESC']]
    });
  }

  async debugEndpoints() {
    // ... (Giữ nguyên logic cũ nếu cần, hoặc xóa đi nếu đã ổn định)
    const config = await jiraConfigRepository.getConfig();
    const { jira_domain, jira_email, api_token } = config;
    const auth = { headers: jiraService.getAuthHeader(jira_email, api_token) };
    const results = {};
    try { await axios.get(`https://${jira_domain}/rest/api/2/project`, auth); results.project_v2 = 'OK'; } catch (e) { results.project_v2 = e.response?.status || e.message; }
    try { await axios.get(`https://${jira_domain}/rest/agile/1.0/board`, auth); results.agile_api = 'OK'; } catch (e) { results.agile_api = e.response?.status || e.message; }
    return results;
  }
}

module.exports = new SyncService();
