// Тест математического отображения
const testMathDisplay = async () => {
  console.log('🎨 Примеры математического отображения\n');

  const examples = [
    'x^2',
    'x^3/3',
    '1/3*x^3',
    '(x-1)*exp(x)',
    'sin(x)^2/2',
    'sin(x)-x*cos(x)',
    'x^3/3 + C',
  ];

  console.log('Исходное → Преобразованное\n');
  console.log('━'.repeat(60));
  
  examples.forEach(expr => {
    let formatted = expr;
    
    // Степени
    formatted = formatted.replace(/\^(\d+)/g, (m, p) => {
      const map = {'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
      return p.split('').map(d => map[d] || d).join('');
    });
    
    // Умножение
    formatted = formatted.replace(/\*/g, '·');
    
    // exp(x) → eˣ
    formatted = formatted.replace(/exp\(([a-z])\)/g, 'e^$1');
    formatted = formatted.replace(/\^([a-z])/g, (m, v) => {
      const map = {'x':'ˣ','y':'ʸ','z':'ᶻ','n':'ⁿ'};
      return map[v] || `^${v}`;
    });
    
    console.log(`${expr.padEnd(25)} → ${formatted}`);
  });
  
  console.log('━'.repeat(60));
  console.log('\n✨ Отображение будет красивым!\n');
};

testMathDisplay();
