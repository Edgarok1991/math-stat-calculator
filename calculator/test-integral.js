// Тестовый скрипт для проверки интегралов
// Запуск: node test-integral.js

const testIntegralAPI = async () => {
  console.log('🧪 Тестирование API интегралов\n');

  // Тест 1: Неопределённый интеграл
  console.log('━'.repeat(60));
  console.log('ТЕСТ 1: Неопределённый интеграл');
  console.log('━'.repeat(60));
  
  const indefiniteData = {
    expression: 'x^2',
    variable: 'x',
    type: 'integral'
  };

  console.log('Входные данные:', indefiniteData);
  console.log('');

  try {
    const response1 = await fetch('http://localhost:3001/calculus/integral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(indefiniteData)
    });

    if (!response1.ok) {
      throw new Error(`HTTP error! status: ${response1.status}`);
    }

    const result1 = await response1.json();
    console.log('✅ Результат:');
    console.log('  Первообразная:', result1.result);
    console.log('\n📝 Пошаговое решение:');
    result1.steps.forEach((step, i) => console.log(`  ${i + 1}. ${step}`));
    console.log('');
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }

  // Тест 2: Определённый интеграл
  console.log('━'.repeat(60));
  console.log('ТЕСТ 2: Определённый интеграл');
  console.log('━'.repeat(60));
  
  const definiteData = {
    expression: 'x^2',
    variable: 'x',
    type: 'integral',
    bounds: {
      lower: 0,
      upper: 1
    }
  };

  console.log('Входные данные:', definiteData);
  console.log('');

  try {
    const response2 = await fetch('http://localhost:3001/calculus/integral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(definiteData)
    });

    if (!response2.ok) {
      throw new Error(`HTTP error! status: ${response2.status}`);
    }

    const result2 = await response2.json();
    console.log('✅ Результат:');
    console.log('  Значение:', result2.result);
    console.log('\n📝 Пошаговое решение:');
    result2.steps.forEach((step, i) => console.log(`  ${i + 1}. ${step}`));
    console.log('');
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }

  console.log('━'.repeat(60));
  console.log('✨ Тестирование завершено!');
  console.log('🌐 Откройте http://localhost:3000/calculus для визуализации\n');
};

testIntegralAPI();
