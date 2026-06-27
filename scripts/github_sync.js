#!/usr/bin/env node
/**
 * Autonomous Web Designer Engine — GitHub Sync (v1.0)
 * Handles Live Mode by pushing generated site to a client repository.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd(); // Run from job directory
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO; // e.g. "username/repo"

if (!GITHUB_TOKEN || !GITHUB_REPO) {
    console.error('MISSING_GITHUB_CONFIG');
    process.exit(1);
}

const distPath = path.join(ROOT, 'dist');
if (!fs.existsSync(distPath)) {
    console.error('DIST_NOT_FOUND');
    process.exit(1);
}

try {
    console.log(`[*] Syncing to GitHub: ${GITHUB_REPO}`);

    // Create a temporary clone/worktree
    const tempRepoPath = path.join(ROOT, 'github_sync_temp');
    if (fs.existsSync(tempRepoPath)) fs.rmSync(tempRepoPath, { recursive: true });

    // Use a simplified approach: just push dist files to a new branch
    const repoUrl = `https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git`;

    process.chdir(distPath);
    execSync('git init');
    execSync('git config user.name "Webify Engine"');
    execSync('git config user.email "engine@webify.luxury"');
    execSync('git add .');
    execSync('git commit -m "Autonomous Modernization: Premium Brutalist V4"');

    const branchName = `webify-modernization-${Date.now()}`;
    execSync(`git checkout -b ${branchName}`);
    execSync(`git remote add origin ${repoUrl}`);
    execSync(`git push origin ${branchName}`);

    console.log(JSON.stringify({
        success: true,
        branch: branchName,
        repo: GITHUB_REPO,
        pr_url: `https://github.com/${GITHUB_REPO}/compare/main...${branchName}?expand=1`
    }));

} catch (err) {
    console.error(`GITHUB_SYNC_FAILED: ${err.message}`);
    process.exit(1);
}
