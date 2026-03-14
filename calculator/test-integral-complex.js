// Тест сложных интегралов
const testComplexIntegrals = async () => {
  console.log('🧪 Тестирование сложных интегралов\n');

  const tests = [
    { expr: 'x^2', name: 'Степенная функция' },
    { expr: 'x * exp(x)', name: 'Произведение x·exp(x)' },
    { expr: 'sin(x) * cos(x)', name: 'Произведение sin·cos' },
    { expr: 'x * sin(x)', name: 'Произведение x·sin(x)' },
  ];

  for (const test of tests) {
    console.log('━'.repeat(60));
    console.log(`📊 ${test.name}`);
    console.log('━'.repeat(60));
    console.log(`Функция: ${test.expr}\n`);

    try {
      const response = await fetch('http://localhost:3001/calculus/integral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expression: test.expr,
          variable: 'x',
          type: 'integral'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Результат:', result.result);
      console.log('\n📝 Пошаговое решение:');
      result.steps.forEach((step, i) => console.log(`  ${i + 1}. ${step}`));
      console.log('');
    } catch (error) {
      console.error('❌ Ошибка:', error.message);
      console.log('');
    }
  }

  console.log('━'.repeat(60));
  console.log('✨ Тестирование завершено!\n');
};

testComplexIntegrals();
