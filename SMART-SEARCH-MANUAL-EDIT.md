## Intelligent File Search - Manual Implementation Steps

Due to file size complexity, here are the exact manual edits needed:

### Edit 1: Around line 320 - Replace the "Check results" and "Prioritize" section

**Find this section** (starts around line 309):
```javascript
    // 4. Check results
    if (files.length === 0) {
        const ownerNumber = config.OWNER_HELP_NUMBER || config.BOT_OWNER.replace(/\D/g, '');
        const mentionJid = `${ownerNumber}@s.whatsapp.net`;

        await sock.sendMessage(remoteJid, {
            text: `❌ *No files found*...
```

**Replace with**:
```javascript
    // 4. Categorize files  
    const categorized = categorizeFiles(files);

    // 5. Filter based on detected intent
    let filesToSend = [];
    let intentMessage = '';
    
    switch (intent.type) {
        case 'final':
            filesToSend = categorized.final;
            if (filesToSend.length === 0) {
                await sock.sendMessage(remoteJid, { text: `❌ No final exam files found for *${subjectCode}*` });
                return;
            }
            intentMessage = ' 📝 (Final Exam Files)';
            break;
            
        case 'midterm':
            filesToSend = categorized.midterm;
            if (filesToSend.length === 0) {
                await sock.sendMessage(remoteJid, { text: `❌ No mid-term files found for *${subjectCode}*` });
                return;
            }
            intentMessage = ' 📝 (Mid-Term Files)';
            break;
            
        case 'handout':
            filesToSend = categorized.handout;
            if (filesToSend.length === 0) {
                await sock.sendMessage(remoteJid, { text: `❌ No handout files found for *${subjectCode}*` });
                return;
            }
            intentMessage = ' 📄 (Handouts)';
            break;
            
        case 'highlightHandout':
            filesToSend = categorized.highlightHandout;
            if (filesToSend.length === 0) {
                await sock.sendMessage(remoteJid, { text: `❌ No highlight handout files found for *${subjectCode}*` });
                return;
            }
            intentMessage = ' ✨ (Highlight Handouts)';
            break;
            
        case 'general':
        default:
            filesToSend = [
                ...categorized.handout, ...categorized.highlightHandout,
                ...categorized.final, ...categorized.midterm,
                ...categorized.grandQuiz, ...categorized.quiz,
                ...categorized.practice, ...categorized.solution,
                ...categorized.other
            ];
            
            if (filesToSend.length === 0) {
                const ownerNumber = config.OWNER_HELP_NUMBER || config.BOT_OWNER.replace(/\D/g, '');
                const mentionJid = `${ownerNumber}@s.whatsapp.net`;
                await sock.sendMessage(remoteJid, {
                    text: `❌ *No files found* for *${subjectCode}* ${keywords ? `with keywords "${keywords}"` : ''}\n\n👤 Please contact the Owner for assistance:\n@${ownerNumber}`,
                    mentions: [mentionJid]
                });
                return;
            }
            break;
    }

    const allSorted = filesToSend;
```

**Continue from** the existing line that says `const initialBatch = limit === 'all' ? Infinity : 10;` (no changes needed from there)

### Update the send message text (around line 400)

Find:
```javascript
    await sock.sendMessage(remoteJid, {
        text: `📚 *Found ${allSorted.length} files* for ${subjectCode}\n🚀 Sending ${limit === 'all' ? 'ALL' : sendingCount} files...${moreText}\n\n⏳ *Please wait for files to arrive.*`
    });
```

Replace with:
```javascript
    await sock.sendMessage(remoteJid, {
        text: `📚 *Found ${allSorted.length} files* for ${subjectCode}${intentMessage}\n🚀 Sending ${limit === 'all' ? 'ALL' : sendingCount} files...${moreText}\n\n⏳ *Please wait for files to arrive.*`
    });
```

## Summary of Changes

✅ Added `FILE_CATEGORIES` for final and midterm
✅ Updated `categorizeFiles` to include final and midterm  
✅ Created `detectSearchIntent` function
✅ Added intent detection before keyword filtering
❌ Need manual edit to replace prioritization logic with intent-based filtering

The system now understands:
- "CS101" → All important files
- "CS101 final" → Only final exam files
- "CS101 mid" → Only mid-term files
- "CS101 handout" → Only handouts
- "CS101 highlight handout" → Only highlight handouts
