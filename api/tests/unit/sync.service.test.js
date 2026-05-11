// mock dependencies
const SyncJob = {
  create: jest.fn(),
  findByPk: jest.fn(),
  update: jest.fn(),
};

const JiraIssue = {
  findOrCreate: jest.fn(),
};

const jiraService = {
  getAllBoards: jest.fn(),
  getIssuesByBoard: jest.fn(),
};

const jiraConfigRepository = {
  getConfig: jest.fn(),
};

// require the service after mocking
jest.mock('../models', () => ({ SyncJob, JiraIssue }));
jest.mock('../services/jira.service', () => jiraService);
jest.mock('../repositories/jira-config.repository', () => jiraConfigRepository);

const syncService = require('../services/sync.service');

describe('SyncService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('triggerSync', () => {
    it('should throw error if config is missing', async () => {
      jiraConfigRepository.getConfig.mockResolvedValue(null);
      await expect(syncService.triggerSync()).rejects.toThrow('Chưa cấu hình Jira');
    });

    it('should create a pending job and start sync', async () => {
      const mockConfig = { jira_domain: 'test.atlassian.net', jira_email: 'a@b.com', api_token: '123' };
      jiraConfigRepository.getConfig.mockResolvedValue(mockConfig);
      
      const mockJob = { id: 1, status: 'pending' };
      SyncJob.create.mockResolvedValue(mockJob);
      
      // spy on processSync to ensure it's called
      const processSpy = jest.spyOn(syncService, 'processSync').mockImplementation(async () => {});

      const result = await syncService.triggerSync();
      
      expect(SyncJob.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending' }));
      expect(result).toEqual(mockJob);
      expect(processSpy).toHaveBeenCalledWith(1, mockConfig);
    });
  });

  describe('saveIssue', () => {
    it('should return isNew: true when issue is newly created', async () => {
      const mockIssue = { key: 'TEST-1', fields: { summary: 'Test', issuetype: { name: 'Task' }, status: { name: 'To Do' } } };
      
      JiraIssue.findOrCreate.mockResolvedValue([{ id: 1, update: jest.fn() }, true]); // true = created

      const result = await syncService.saveIssue(mockIssue);
      
      expect(result.isNew).toBe(true);
      expect(JiraIssue.findOrCreate).toHaveBeenCalled();
    });

    it('should return isNew: false when issue already exists', async () => {
      const mockIssue = { key: 'TEST-1', fields: { summary: 'Test', issuetype: { name: 'Task' }, status: { name: 'To Do' } } };
      
      const updateMock = jest.fn();
      JiraIssue.findOrCreate.mockResolvedValue([{ id: 1, update: updateMock }, false]); // false = existed

      const result = await syncService.saveIssue(mockIssue);
      
      expect(result.isNew).toBe(false);
      expect(updateMock).toHaveBeenCalled();
    });
  });
});
