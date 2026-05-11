const fs = require('fs');
const { JiraIssue } = require('../api/models');

async function findValue() {
  const issue = await JiraIssue.findOne({ where: { issue_key: 'DEV-8253' } });
  if (!issue) {
    console.log('Issue not found');
    return;
  }
  const data = issue.jira_data;
  const fields = data.fields;
  
  console.log('--- Fields with value 2 or "2" in DEV-8253 ---');
  for (const [key, value] of Object.entries(fields)) {
    if (value == 2) {
      console.log(`${key}: ${JSON.stringify(value)}`);
    }
  }
  process.exit();
}

findValue();
