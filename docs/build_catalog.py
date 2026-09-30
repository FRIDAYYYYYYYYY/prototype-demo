import os
import glob
import re

roots = [
    r'C:\Users\Sri\.gemini\config\skills',
    r'C:\Users\Sri\.gemini\config\plugins',
    r'C:\Users\Sri\.gemini\antigravity-ide\builtin\skills'
]

skills = []

for root in roots:
    for skill_md in glob.glob(os.path.join(root, '**', 'SKILL.md'), recursive=True):
        folder = os.path.dirname(skill_md)
        skill_name = os.path.basename(folder)
        
        desc = ''
        name = skill_name
        try:
            with open(skill_md, 'r', encoding='utf-8') as f:
                content = f.read()
                if content.startswith('---'):
                    parts = content.split('---', 2)
                    if len(parts) >= 3:
                        fm_text = parts[1]
                        m_name = re.search(r'^name:\s*(.+)$', fm_text, re.MULTILINE)
                        if m_name:
                            name = m_name.group(1).strip()
                        m_desc = re.search(r'^description:\s*\|?\s*(.*?)(?=\n[a-z0-9_-]+:|\Z)', fm_text, re.MULTILINE | re.DOTALL)
                        if m_desc:
                            desc = " ".join(m_desc.group(1).split())
        except Exception as e:
            desc = str(e)
            
        subfolders = []
        for sub in ['scripts', 'references', 'examples', 'resources']:
            sub_path = os.path.join(folder, sub)
            if os.path.isdir(sub_path):
                files = os.listdir(sub_path)
                preview = ", ".join(files[:4])
                if len(files) > 4:
                    preview += f", ... (+{len(files)-4} more)"
                subfolders.append(f"`{sub}/` ({len(files)} items: {preview})")
                
        skills.append({
            'name': name,
            'folder': folder,
            'skill_md': skill_md,
            'desc': desc if desc else 'General operational skill.',
            'subfolders': subfolders
        })

skills = sorted(skills, key=lambda x: x['name'].lower())

md_lines = []
md_lines.append("# Master Antigravity Skills Index & Catalog")
md_lines.append(f"**Total Skills Discovered:** {len(skills)}")
md_lines.append(f"**Indexed Locations:** `~/.gemini/config/skills`, `~/.gemini/config/plugins`, `~/.gemini/antigravity-ide/builtin/skills`\n")
md_lines.append("---\n")

for i, s in enumerate(skills, 1):
    md_lines.append(f"### {i}. `{s['name']}`")
    md_lines.append(f"- **Path:** [`{s['folder']}`](file:///{s['folder'].replace(chr(92), '/')})")
    md_lines.append(f"- **Purpose:** {s['desc']}")
    if s['subfolders']:
        md_lines.append(f"- **Included Subfolders:** {'; '.join(s['subfolders'])}")
    else:
        md_lines.append(f"- **Included Subfolders:** *None (Standalone `SKILL.md`)*")
    md_lines.append("")

output_path = r'C:\Users\Sri\OneDrive\Desktop\friday_traintraffic\prototype-demo\docs\master-skills-catalog.md'
with open(output_path, 'w', encoding='utf-8') as f:
    f.write("\n".join(md_lines))

print(f"Generated catalog for {len(skills)} skills at {output_path}")
