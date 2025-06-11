// update-cache-version.js
const fs = require('fs');
const path = require('path');

function updateCacheVersion() {
    const indexPath = path.join(__dirname, 'index.html');
    
    if (!fs.existsSync(indexPath)) {
        console.error('❌ index.html not found');
        process.exit(1);
    }
    
    // Generate new version based on timestamp
    const timestamp = Date.now();
    const newVersion = `v=${timestamp}`;
    
    try {
        // Read the HTML file
        let html = fs.readFileSync(indexPath, 'utf8');
        
        // Replace cache version in CSS and JS files
        html = html.replace(/styles\.css\?v=[\w\d\.\-]+/g, `styles.css?${newVersion}`);
        html = html.replace(/app\.js\?v=[\w\d\.\-]+/g, `app.js?${newVersion}`);
        
        // If no version found, add version to files
        if (!html.includes('styles.css?v=')) {
            html = html.replace(/styles\.css/g, `styles.css?${newVersion}`);
        }
        if (!html.includes('app.js?v=')) {
            html = html.replace(/app\.js/g, `app.js?${newVersion}`);
        }
        
        // Write the updated HTML
        fs.writeFileSync(indexPath, html);
        
        console.log(`✅ Cache version updated to: ${newVersion}`);
        console.log('📄 Updated files:');
        console.log(`   - styles.css?${newVersion}`);
        console.log(`   - app.js?${newVersion}`);
        
    } catch (error) {
        console.error('❌ Error updating cache version:', error);
        process.exit(1);
    }
}

// Run the function
updateCacheVersion();