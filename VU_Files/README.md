# VU_Files Directory

This directory is used to store files that you want to share via the bot.

## How to Add Files

1. Simply copy or move files into this `VU_Files` directory
2. The bot will automatically detect and list them
3. Users can view the file list using the `!files` command

## File Organization

- Keep file names descriptive and clear
- Consider organizing files by category if you have many
- Remove files you no longer want to share

## Supported File Types

The bot can list any file type. Common examples:
- Documents (PDF, DOCX, TXT)
- Images (JPG, PNG, GIF)
- Videos (MP4, AVI)
- Archives (ZIP, RAR)
- Spreadsheets (XLS, CSV)

## Example Files

Add some example files here to get started:
- product_catalog.pdf
- price_list.xlsx
- company_brochure.pdf
- tutorial_video.mp4

## Security

The bot implements path validation to prevent directory traversal attacks.
Only files in this directory can be accessed via the bot.
