# 📊 Раздел "Анализ данных" - Краткая справка

## ✅ Что сделано

Создан раздел **"Анализ данных"**, объединяющий:
- 🧠 **Кластерный анализ** (иерархическая кластеризация)
- 📊 **ANOVA** (дисперсионный анализ)

---

## 🚀 Как пользоваться

### Способ 1: С главной страницы
```
http://localhost:3000/
↓
Карточка "Анализ данных"
↓
Выберите инструмент
```

### Способ 2: Через меню
```
Header → "Анализ данных"
↓
Выберите инструмент
```

### Способ 3: Прямые ссылки
```
http://localhost:3000/data-analysis    - главная раздела
http://localhost:3000/clustering       - кластеризация
http://localhost:3000/anova             - ANOVA
```

---

## 📁 Изменённые файлы

### Созданные (1)
- ✅ `frontend/src/app/data-analysis/page.tsx` - главная раздела

### Обновлённые (4)
- ✅ `frontend/src/app/page.tsx` - карточка "Анализ данных"
- ✅ `frontend/src/components/Layout/Header.tsx` - меню
- ✅ `frontend/src/app/clustering/page.tsx` - breadcrumb
- ✅ `frontend/src/app/anova/page.tsx` - breadcrumb

---

## 🎯 Навигация

### На главной раздела
```
/data-analysis
├── Кластерный анализ → /clustering
└── ANOVA → /anova
```

### На подстраницах
```
/clustering или /anova
↑
← Назад к Анализу данных
```

### В Header
```
Анализ данных    ← подсвечен для:
                 - /data-analysis
                 - /clustering
                 - /anova
```

---

## ✅ Проверка

### Откройте
```
http://localhost:3000/data-analysis
```

### Проверьте
- ✅ Hero-секция с градиентом
- ✅ 2 карточки инструментов
- ✅ Кнопки работают
- ✅ Breadcrumb на подстраницах
- ✅ Header подсвечивает "Анализ данных"

---

**Готово! 🎉**

**URL:** http://localhost:3000/data-analysis
