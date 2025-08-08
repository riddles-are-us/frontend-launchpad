#!/usr/bin/env node

/**
 * Script to add or update project descriptions
 * Usage: node src/scripts/add-project-description.js <projectId> <description> [longDescription]
 */

const fs = require('fs');
const path = require('path');

const DESCRIPTIONS_FILE = path.join(__dirname, '../data/project-descriptions.json');

function loadDescriptions() {
  try {
    const data = fs.readFileSync(DESCRIPTIONS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading descriptions file:', error.message);
    process.exit(1);
  }
}

function saveDescriptions(data) {
  try {
    fs.writeFileSync(DESCRIPTIONS_FILE, JSON.stringify(data, null, 2) + '\n');
    console.log('✅ Project descriptions updated successfully!');
  } catch (error) {
    console.error('Error saving descriptions file:', error.message);
    process.exit(1);
  }
}

function addProjectDescription(projectId, description) {
  const data = loadDescriptions();
  
  if (!data.descriptions) {
    data.descriptions = {};
  }

  const existingProject = data.descriptions[projectId];
  
  data.descriptions[projectId] = {
    description,
    website: existingProject?.website || "",
    twitter: existingProject?.twitter || "",
    telegram: existingProject?.telegram || ""
  };

  saveDescriptions(data);
  
  if (existingProject) {
    console.log(`📝 Updated description for project ID: ${projectId}`);
  } else {
    console.log(`➕ Added new description for project ID: ${projectId}`);
  }
  
  console.log(`Description: ${description}`);
}

function listProjects() {
  const data = loadDescriptions();
  console.log('📋 Available project descriptions:');
  console.log('');
  
  Object.entries(data.descriptions).forEach(([id, project]) => {
    console.log(`ID: ${id}`);
    console.log(`Description: ${project.description}`);
    console.log(`Website: ${project.website || 'Not set'}`);
    console.log(`Twitter: ${project.twitter || 'Not set'}`);
    console.log(`Telegram: ${project.telegram || 'Not set'}`);
    console.log('---');
  });
}

// Main script
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === 'list') {
  listProjects();
} else if (args.length >= 2) {
  const [projectId, description] = args;
  addProjectDescription(projectId, description);
} else {
  console.log('Usage:');
  console.log('  node src/scripts/add-project-description.js list');
  console.log('  node src/scripts/add-project-description.js <projectId> <description>');
  console.log('');
  console.log('Examples:');
  console.log('  node src/scripts/add-project-description.js 4 "New DeFi protocol for cross-chain swaps"');
  console.log('  node src/scripts/add-project-description.js 5 "Gaming NFT platform with P2E mechanics"');
}