const syncService = require('../services/sync.service');
const jiraIssueRepository = require('../repositories/jira-issue.repository');

class SyncController {
  async triggerSync(req, res, next) {
    try {
      const job = await syncService.triggerSync();
      res.json({ 
        status: 'success', 
        message: 'Đã bắt đầu tiến trình đồng bộ ngầm', 
        data: job 
      });
    } catch (err) {
      next(err);
    }
  }

  async getJobStatus(req, res, next) {
    try {
      const job = await syncService.getLatestJob();
      res.json({ status: 'success', data: job });
    } catch (err) {
      next(err);
    }
  }

  async getIssues(req, res, next) {
    try {
      const { rows, count } = await jiraIssueRepository.getAll(req.query);
      res.json({ 
        status: 'success', 
        data: rows,
        pagination: {
          total: count,
          page: parseInt(req.query.page) || 1,
          limit: parseInt(req.query.limit) || 30
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async getIssueDetail(req, res, next) {
    try {
      const issue = await jiraIssueRepository.getById(req.params.id);
      if (!issue) return res.status(404).json({ status: 'fail', message: 'Không tìm thấy task' });
      res.json({ status: 'success', data: issue });
    } catch (err) {
      next(err);
    }
  }

  async debugSync(req, res, next) {
    try {
      const results = await syncService.debugEndpoints();
      res.json({ status: 'success', data: results });
    } catch (err) {
      next(err);
    }
  }

  async getFilterOptions(req, res, next) {
    try {
      const options = await jiraIssueRepository.getFilterOptions();
      res.json({ status: 'success', data: options });
    } catch (err) { next(err); }
  }
}

module.exports = new SyncController();
