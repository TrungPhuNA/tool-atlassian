const jiraService = require('../api/services/jira.service');
const jiraConfigRepository = require('../api/repositories/jira-config.repository');

async function checkIssue() {
  const config = await jiraConfigRepository.getConfig();
  if (!config) return;
  const { jira_domain, jira_email, api_token } = config;
  
  try {
    const issue = await jiraService.getIssue(jira_domain, jira_email, api_token, 'DEV-8253');
    const fields = issue.fields;
    
    console.log('--- Finding field with value 2 in DEV-8253 (Detailed API) ---');
    for (const [key, value] of Object.entries(fields)) {
      if (value == 2) {
        console.log(`${key}: ${JSON.stringify(value)}`);
      }
    }
  } catch (err) {
    console.error('Error fetching issue:', err.message);
  }
  process.exit();
}

checkIssue();
