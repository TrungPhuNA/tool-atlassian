const { JiraIssue, sequelize } = require('../models');
const { Op } = require('sequelize');

class JiraIssueRepository {
    async upsert(data) {
        const existing = await JiraIssue.findOne({
            where: { issue_key: data.issue_key }
        });

        if (existing) {
            return existing.update(data);
        }
        return JiraIssue.create(data);
    }

    async getAll(filters = {}) {
        const where = {};
        const { Op } = require('sequelize');

        if (filters.assignee_id) {
            const assigneeIds = typeof filters.assignee_id === 'string' ? filters.assignee_id.split(',') : (Array.isArray(filters.assignee_id) ? filters.assignee_id : [filters.assignee_id]);
            const cleanIds = assigneeIds.filter(Boolean);
            if (cleanIds.length > 0) where.assignee_id = { [Op.in]: cleanIds };
        }

        if (filters.status) {
            const statuses = typeof filters.status === 'string' ? filters.status.split(',') : (Array.isArray(filters.status) ? filters.status : [filters.status]);
            const cleanStatuses = statuses.filter(s => s && s !== 'All');
            if (cleanStatuses.length > 0) {
                // Kiểm tra xem có lọc loại bỏ không (status_exclude)
                const exclude = filters.status_exclude === 'true' || filters.status_exclude === true;
                where.status = exclude ? { [Op.notIn]: cleanStatuses } : { [Op.in]: cleanStatuses };
            }
        }

        if (filters.sprint) {
            const sprints = typeof filters.sprint === 'string' ? filters.sprint.split(',') : (Array.isArray(filters.sprint) ? filters.sprint : [filters.sprint]);
            const cleanSprints = sprints.filter(Boolean);
            if (cleanSprints.length > 0) where.sprint_name = { [Op.in]: cleanSprints };
        }

        // ==========================================
        // BỘ LỌC PHÂN CẤP TASK (TASK HIERARCHY)
        // Mục đích: Cho phép lọc lấy riêng task cha, lấy riêng task con, hoặc cả hai.
        // Logic xử lý chính:
        // - Nếu là 'parent' (Task cha): Lọc các bản ghi có parent_id là null.
        // - Nếu là 'subtask' (Task con): Lọc các bản ghi có parent_id khác null (tức là có liên kết cha con).
        // - Mặc định (all hoặc không chọn): Không áp dụng điều kiện lọc parent_id để lấy toàn bộ cả hai loại.
        // ==========================================
        if (filters.task_hierarchy) {
            if (filters.task_hierarchy === 'parent') {
                where.parent_id = null;
            } else if (filters.task_hierarchy === 'subtask') {
                where.parent_id = { [Op.ne]: null };
            }
        }

        // Bộ lọc chất lượng dữ liệu (Data Quality)
        if (filters.missing_description === 'true') where.has_description = false;
        if (filters.missing_story_points === 'true') where.has_story_points = false;
        if (filters.missing_due_date === 'true') where.has_due_date = false;

        // Bộ lọc cần trao đổi giải pháp
        if (filters.needs_solution_discussion === 'true') where.needs_solution_discussion = true;

        // Lọc theo khoảng thời gian hạn chót (Due Date)
        if (filters.due_date_from || filters.due_date_to) {
            where.due_date = {};
            if (filters.due_date_from) where.due_date[Op.gte] = filters.due_date_from;
            if (filters.due_date_to) where.due_date[Op.lte] = filters.due_date_to;
        }

        if (filters.search) {
            where[Op.or] = [
                { issue_key: { [Op.like]: `%${filters.search}%` } },
                { summary: { [Op.like]: `%${filters.search}%` } },
                { assignee_name: { [Op.like]: `%${filters.search}%` } }
            ];
        }

        const page = parseInt(filters.page) || 1;
        const limit = parseInt(filters.limit) || 30;
        const offset = (page - 1) * limit;

        // Xác định thứ tự sắp xếp
        let order = [['start_date', 'DESC']];
        if (filters.order_by === 'assignee_name') {
            order = [['assignee_name', 'ASC'], ['start_date', 'DESC']];
        } else if (filters.order_by === 'parent_first') {
            order = [
                [sequelize.literal('COALESCE(parent_id, id)'), 'ASC'],
                [sequelize.literal('parent_id IS NOT NULL'), 'ASC'],
                ['assignee_name', 'ASC'],
                ['start_date', 'DESC']
            ];
        }

        const { rows, count } = await JiraIssue.findAndCountAll({
            where,
            limit,
            offset,
            order,
            attributes: { exclude: ['jira_data'] },
            include: [
                {
                    model: JiraIssue,
                    as: 'subtasks',
                    attributes: { exclude: ['jira_data'] }
                }
            ],
            distinct: true
        });

        // Tính toán thống kê trên toàn bộ tập dữ liệu (đã áp dụng where)
        const stats = {
            total: count,
            missingDescription: await JiraIssue.count({ where: { ...where, has_description: false } }),
            missingStoryPoints: await JiraIssue.count({ where: { ...where, has_story_points: false } }),
            missingDueDate: await JiraIssue.count({ where: { ...where, has_due_date: false } }),
            standard: await JiraIssue.count({
                where: {
                    ...where,
                    has_description: true,
                    has_story_points: true,
                    has_due_date: true
                }
            })
        };

        return { rows, count, stats };
    }

    async getById(idOrKey) {
        // Nếu là ID (số)
        if (!isNaN(idOrKey)) {
            return await JiraIssue.findByPk(idOrKey, {
                include: [
                    { model: JiraIssue, as: 'subtasks' },
                    { model: JiraIssue, as: 'parent' }
                ]
            });
        }
        // Nếu là Key (chuỗi như DP-948)
        return await JiraIssue.findOne({
            where: { issue_key: idOrKey },
            include: [
                { model: JiraIssue, as: 'subtasks' },
                { model: JiraIssue, as: 'parent' }
            ]
        });
    }

    async getFilterOptions() {
        try {
            // Lấy danh sách trạng thái duy nhất
            const statusData = await JiraIssue.findAll({
                attributes: ['status'],
                group: ['status'],
                raw: true
            });

            // Lấy danh sách người làm duy nhất (kèm avatar)
            const userData = await JiraIssue.findAll({
                attributes: ['assignee_id', 'assignee_name', 'assignee_avatar'],
                where: {
                    assignee_id: { [Op.ne]: null }
                },
                group: ['assignee_id', 'assignee_name', 'assignee_avatar'],
                raw: true
            });

            // Lấy danh sách Sprint duy nhất
            const sprintData = await JiraIssue.findAll({
                attributes: ['sprint_name'],
                where: { sprint_name: { [Op.ne]: null } },
                group: ['sprint_name'],
                raw: true
            });

            return {
                statuses: statusData.map(s => s.status).filter(Boolean),
                sprints: sprintData.map(s => s.sprint_name).filter(Boolean),
                users: userData.map(u => ({
                    id: u.assignee_id,
                    name: u.assignee_name,
                    avatar: u.assignee_avatar
                }))
            };
        } catch (err) {
            console.error('[Repository] Error in getFilterOptions:', err);
            throw err;
        }
    }

    async findByJiraId(jiraId) {
        return JiraIssue.findOne({ where: { jira_account_id: jiraId } }); // Lưu ý: mapping này sẽ làm sau
    }

    async updateSolutionDiscussion(id, value) {
        const issue = await JiraIssue.findByPk(id);
        if (!issue) return null;
        return issue.update({ needs_solution_discussion: value });
    }
}

module.exports = new JiraIssueRepository();
