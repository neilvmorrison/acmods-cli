export const GITATTRIBUTES = `\
*.kn5 filter=lfs diff=lfs merge=lfs -text
*.ai filter=lfs diff=lfs merge=lfs -text
*.png filter=lfs diff=lfs merge=lfs -text
*.blend filter=lfs diff=lfs merge=lfs -text
`;

export const GITIGNORE = `\
# macOS
.DS_Store
.AppleDouble
.LSOverride
._*
.Spotlight-V100
.Trashes
.fseventsd
.VolumeIcon.icns

# Blender backups
*.blend1
*.blend2

# Windows
Thumbs.db
ehthumbs.db
Desktop.ini
$RECYCLE.BIN/

# Editors
.vscode/
.idea/
`;
