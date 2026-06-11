const fs = require('fs');
const path = require('path');

const files = [
  'src/pages/landingpage/Disclaimer.tsx',
  'src/pages/landingpage/components/AboutSection.tsx',
  'src/pages/landingpage/LocalsPublicos.tsx',
  'src/pages/landingpage/MorfologiaPage.tsx',
  'src/pages/landingpage/MorfologiaOrgaoPage.tsx',
  'src/pages/landingpage/CatalogoFamilias.tsx',
  'src/pages/landingpage/DetalhesFamilia.tsx',
  'src/pages/landingpage/DetalhesEspecie.tsx',
  'src/pages/landingpage/DetalhesLocal.tsx',
  'src/pages/landingpage/DetalhesEspecimeLocal.tsx'
];

const replacements = {
  '\\[#1a3a1f\\]': 'forest-900',
  '\\[#2d5a3d\\]': 'forest-800',
  '\\[#4a7c5a\\]': 'forest-600',
  '\\[#5fcf6e\\]': 'forest-400',
  '\\[#4eb85c\\]': 'forest-500',
  '\\[#f8faf6\\]': 'forest-50',
  '\\[#f0f5ee\\]': 'forest-100',
  '\\[#dde8d5\\]': 'forest-200',
  '\\[#e2edd8\\]': 'forest-200',
  '\\[#0d2410\\]': 'forest-950',
  '\\[#4a5a44\\]': 'neutral-700',
  '\\[#7a9a7a\\]': 'neutral-500',
  '\\[#b0c8b0\\]': 'neutral-400',
  
  'stone-50': 'neutral-50',
  'stone-100': 'neutral-100',
  'stone-150': 'neutral-200',
  'stone-200': 'neutral-200',
  'stone-250': 'neutral-300',
  'stone-300': 'neutral-300',
  'stone-400': 'neutral-400',
  'stone-500': 'neutral-500',
  'stone-600': 'neutral-600',
  'stone-700': 'neutral-700',
  'stone-800': 'neutral-800',
  'stone-850': 'neutral-800',
  'stone-900': 'neutral-900',

  'emerald-': 'forest-',
  'teal-': 'forest-',
};

for (const file of files) {
  const fullPath = path.join('/home/jayan-moura/Área de trabalho/Projetos/Veridia-Saber-Admin', file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Custom replacements for inline styles in DetalhesEspecie.tsx
    content = content.replace(
      /style={{ color: '#4a7c5a', fontSize: 12, marginTop: 4 }}/g,
      'className="text-forest-600 text-xs mt-1"'
    );
    content = content.replace(
      /style={{ fontSize: 12, marginTop: 4 }}/g,
      'className="text-xs mt-1"'
    );
    content = content.replace(
      /style={{ fontSize: 11, color: '#7a9a7a', marginTop: 2 }}/g,
      'className="text-[11px] text-neutral-500 mt-0.5"'
    );
    content = content.replace(
      /style={{ fontSize: 11, color: '#7a9a7a' }}/g,
      'className="text-[11px] text-neutral-500"'
    );

    for (const [key, value] of Object.entries(replacements)) {
      const regex = new RegExp(key, 'g');
      content = content.replace(regex, value);
    }
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Processed ${file}`);
  } else {
    console.log(`File not found: ${file}`);
  }
}
