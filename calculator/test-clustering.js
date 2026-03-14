// Тестовый скрипт для проверки кластерного анализа
// Запуск: node test-clustering.js

const testClusteringAPI = async () => {
  console.log('🧪 Тестирование API кластерного анализа\n');

  // Пример данных с сайта https://axd.semestr.ru/upr/cluster.php
  const testData = {
    points: [
      [2, 8],
      [4, 10],
      [5, 7],
      [12, 6],
      [14, 6],
      [15, 4]
    ],
    k: 2,
    method: 'single' // ближний сосед
  };

  console.log('📊 Исходные данные:');
  console.log('Объекты:', testData.points);
  console.log('Количество кластеров:', testData.k);
  console.log('Метод:', testData.method === 'single' ? 'Ближний сосед' : testData.method);
  console.log('\n🔄 Отправка запроса...\n');

  try {
    const response = await fetch('http://localhost:3001/clustering/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    console.log('✅ Результат получен!\n');
    console.log('━'.repeat(60));
    console.log('📈 КРАТКИЕ РЕЗУЛЬТАТЫ');
    console.log('━'.repeat(60));
    console.log(`Метод: ${result.method === 'single' ? 'Ближний сосед (Single Linkage)' : result.method}`);
    console.log(`Количество кластеров: ${result.clusters.length}`);
    console.log(`Расстояние между кластерами: P = ${result.finalDistance?.toFixed(2) || 'N/A'}\n`);

    console.log('📌 Итоговые кластеры:');
    result.clusters.forEach((cluster, index) => {
      const objectNumbers = cluster.map(i => i + 1);
      console.log(`  S(${objectNumbers.join(',')}) - объекты [${objectNumbers.join(', ')}]`);
    });

    if (result.steps && result.steps.length > 0) {
      console.log('\n━'.repeat(60));
      console.log('📋 ПОШАГОВОЕ РЕШЕНИЕ');
      console.log('━'.repeat(60));
      console.log(`Всего шагов: ${result.steps.length}\n`);

      result.steps.forEach((step, index) => {
        console.log(`${'─'.repeat(60)}`);
        console.log(`Шаг ${step.step}: ${step.description}`);
        
        if (step.detailedDescription) {
          console.log(`\n📝 ${step.detailedDescription}`);
        }

        if (step.minDistance !== undefined) {
          console.log(`\n⚡ Минимальное расстояние: ${step.minDistance.toFixed(4)}`);
        }

        console.log(`\n🔢 Текущие кластеры: ${step.remainingClusters || step.clusters.length}`);
        step.clusters.forEach((cluster, i) => {
          const objectNumbers = cluster.map(idx => idx + 1);
          console.log(`   S(${objectNumbers.join(',')}) = [${objectNumbers.join(', ')}]`);
        });
        console.log('');
      });
    }

    console.log('━'.repeat(60));
    console.log('🎯 ЗАКЛЮЧЕНИЕ');
    console.log('━'.repeat(60));
    console.log(`При проведении кластерного анализа по принципу "ближнего соседа"`);
    console.log(`получили ${result.clusters.length} кластера, расстояние между которыми`);
    console.log(`равно P = ${result.finalDistance?.toFixed(2) || 'N/A'}.`);
    console.log('━'.repeat(60));

    console.log('\n✨ Тест успешно завершён!');
    console.log('🌐 Откройте http://localhost:3000/clustering для визуализации\n');

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.log('\n💡 Убедитесь, что backend запущен на порту 3001');
    console.log('   Запустите: cd calculator/backend && npm run start:dev\n');
  }
};

// Запуск теста
testClusteringAPI();
