# Push в GitHub

Репозиторий `math-stat-calculator` создан. Выполните в терминале:

```bash
cd /Users/edgar/Desktop/Project/math-stat-calculator

# Замените YOUR_USERNAME на ваш GitHub username (из URL: github.com/YOUR_USERNAME/math-stat-calculator)
git remote add origin https://github.com/YOUR_USERNAME/math-stat-calculator.git
git push -u origin main
```

Если remote уже добавлен с неверным username:

```bash
git remote set-url origin https://github.com/YOUR_USERNAME/math-stat-calculator.git
git push -u origin main
```
