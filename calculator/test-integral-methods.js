// Тест методов интегрирования: подстановка и по частям
// Запуск: node calculator/test-integral-methods.js
// (требуется запущенный backend на localhost:3001)

const tests = [
  { expr: 'x*exp(x)', desc: 'Интегрирование по частям: x·eˣ' },
  { expr: 'x*sin(x)', desc: 'Интегрирование по частям: x·sin(x)' },
  { expr: 'log(x)', desc: 'Интегрирование по частям: ln(x)' },
  { expr: 'x^2*exp(x)', desc: 'Интегрирование по частям (дважды): x²·eˣ' },
  { expr: 'x*exp(x^2)', desc: 'Подстановка: x·e^(x²)' },
  { expr: '(x+1)^2', desc: 'Подстановка: (x+1)²' },
  { expr: '1/(x+1)', desc: 'Подстановка: 1/(x+1)' },
  { expr: '2x/(x^2+1)', desc: 'Подстановка: 2x/(x²+1)' },
  { expr: 'sin(2x)', desc: 'Подстановка: sin(2x)' },
];

async function runTests() {
  console.log('Тестирование калькулятора интегралов\n');
  
  for (const { expr, desc } of tests) {
    try {
      const res = await fetch('http://localhost:3001/calculus/integral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expression: expr, variable: 'x', type: 'integral' }),
      });
      const data = await res.json();
      console.log(`✓ ${desc}`);
      console.log(`  ∫(${expr}) dx = ${data.result}`);
      if (data.steps?.length) {
        console.log(`  Шаги: ${data.steps.length}`);
      }
      console.log('');
    } catch (e) {
      console.log(`✗ ${desc}: ${e.message}\n`);
    }
  }
}

runTests().catch(console.error);
