import fs from 'fs';
import path from 'path';

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;

    content = content.replace(/await expect\((.+?)\)\.rejects\.toThrowError\((.+?)\);/g, (match, asyncCall, errorType) => {
        return `try {\n            await ${asyncCall};\n            throw new Error('Expected to throw');\n        } catch (e) {\n            expect(e).toBeInstanceOf(${errorType});\n        }`;
    });
    
    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log(`Updated ${filePath}`);
    }
}

['tests/company.controller.test.js', 'tests/user.controller.test.js'].forEach(f => {
    const p = path.join('c:/Users/siuni/RepoPrograWebServidor/Practica', f);
    if (fs.existsSync(p)) processFile(p);
});
