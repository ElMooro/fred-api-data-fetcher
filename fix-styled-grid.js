const fs = require('fs');
const file = process.argv[2];

if (!file) {
  console.error('No file provided');
  process.exit(1);
}

const content = fs.readFileSync(file, 'utf8');

// Look for the styled component definition
const styledGridRegex = /const StyledGrid\s*=\s*styled\(Grid\)\`[^`]*\`/;
if (styledGridRegex.test(content)) {
  // Update the styled component to include the item prop
  const updatedContent = content.replace(
    styledGridRegex,
    `const StyledGrid = styled(Grid)\`
  // Include the necessary MUI Grid props
  \``
  );
  
  fs.writeFileSync(file, updatedContent, 'utf8');
  console.log('Updated StyledGrid component in', file);
}
