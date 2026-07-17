export const PLAYBOOK_REGEX = {
  decoratorSplit: /@RegisterAssistantTool\s*\(\s*\)/,
  className: /class\s+(\w+)/,
  playbookLiteral: /readonly\s+playbook\s*=\s*(['"`])([\s\S]*?)\1\s*;/,
  playbookAny: /readonly\s+playbook\s*=\s*([^;]+?);/,
  nameLiteral: /readonly\s+name\s*=\s*(['"`])([\s\S]*?)\1\s*;/,
};
