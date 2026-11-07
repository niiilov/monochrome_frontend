# Design QA — zerohash EU

Source: https://zerohash.com/eu. Preview: http://localhost:3001/eu.

## Evidence

- Desktop, 1280 × 720 CSS px and image px, device scale 1. Source `../zerohash-reference/desktop-top.png`, implementation `../zerohash-reference/local-desktop-final.png`. Both show the top of the page with the consent dialog dismissed and menus closed.
- Mobile, 390 × 844 CSS px and image px, device scale 1. Source `../zerohash-reference/mobile-top.png`, implementation `../zerohash-reference/local-mobile-final.png`, side by side in `../zerohash-reference/final-mobile-comparison.png`.
- The desktop section overview `../zerohash-reference/final-sections-comparison.png` aligns each pair to the same scroll increment. Animation and rotating logos are sampled at different times. The final report and footer detail frames are `../zerohash-reference/local-report-final.png` and `../zerohash-reference/local-footer-final.png`.
- Focused checks covered the first screen, responsive navigation, report cover, FAQ expansion and footer. The original font families, hero scene, video loops, product images and feature animations load from local files. The copy and section order follow the reference. Remaining differences include some nav menu ornamentation and the timing of rotating logos.

## Iterations

- P2 mobile first-screen height. At 390 px the original title occupied three lines and the first implementation used two. Restored the break and original tracking. Final hero heights are 771 and 770 px.
- P2 desktop scroll behavior. The first implementation displayed the floating header while scrolling down. It now moves out of view on downward scrolling and reappears on upward scrolling or keyboard focus.
- P2 report artwork sizing. Restored the large cover position and crop using the source cover asset. Added the SVG namespace to the extracted social icons and confirmed the image error count returned to zero after reload.

## Interaction checks

Desktop and mobile navigation, desktop product tabs, mobile accordion, Escape to close, both carousels, FAQ expansion, region selector and local privacy dialog. No horizontal page overflow at 320, 390, 768 or 1280 px. No browser console errors or warnings on final reload. The preview privacy dialog opens from the footer and stores choices locally. Login and demo lead to the original service.

final result: passed

## Авторизация MONO

Источники — вложения пользователя от 19.36.18 (композиция), 19.36.48 (карточка), 19.36.03 (код) и 19.47.54 (предыдущая реализация). Проверенный экран — http://127.0.0.1:3107/auth. Снимки предпросмотра сняты в браузере при 1280 × 800 и 390 × 844 CSS px. Референсы показывают разные продукты и содержат внешние рамки, поэтому сравнение проведено по структуре экрана и отдельным компонентам, без пиксельного наложения.

- Композиция — светлая карточка справа, навигация в отдельной верхней строке, левая область целиком отведена анимации. На мобильном карточка занимает одну колонку без горизонтальной прокрутки.
- Типографика, интервалы и цвет — Manrope из MONO, центрированный заголовок, ровные ряды полей и провайдеров, жёлтая основная кнопка и красное состояние ошибки. Убраны рекламный заголовок и дублирующий выход из карточки.
- Графика — используется исходная анимация MONO. После первого просмотра повышена выраженность узора на странице авторизации и скорректированы отступы, чтобы карточка целиком помещалась на проверенном десктопном экране.
- Проверены переход между входом и регистрацией, ошибочный код, повторный запрос, успешный ввод, переход из мобильного меню и уведомление Яндекс ID. Код и кнопки провайдеров демонстрационные.

final result: passed

## Дашборд MONO

Референс — вложение от 20.04.19, контактный лист 2048 × 494 px с четырьмя частично обрезанными десктопными вариантами. Предпросмотр — http://127.0.0.1:3107/dashboard. Проверены снимки обзора в браузере при 1280 × 840 и 390 × 844 CSS px. Сравнение по композиции и отдельным компонентам, поскольку у контактного листа нет полного исходного экрана или мобильного состояния.

- Композиция — сохранены тёмная боковая панель с поиском и тарифами, ряд метрик и широкий график. График взят из столбчатого варианта, заголовок с месяцем — из версии справа. Таблица продолжает обзор ниже графика.
- Типографика и цвет — Manrope и жёлтый токен MONO. Акцент отмечает активный период, столбец и основную метрику. Вторичные подписи и статусы различимы на тёмном фоне.
- Графика — используется существующая эмблема MONO, иконки Phosphor и график, построенный по демо-данным.
- Проверены переключение периода, фильтрация по тарифу, пустой результат поиска и переход в дашборд после демо-подтверждения. На мобильном нет горизонтальной прокрутки страницы. Таблица прокручивается внутри своей карточки.

final result: passed

## Навбар MONO с логотипом-ключом

Сравнение опирается на два пользовательских снимка от 14.08.38 и 14.08.48. Первый снимок показывает исходное расположение элементов, второй задаёт форму логотипа. Реализация снята на `http://127.0.0.1:3107/` при ширине 1280 CSS px и на мобильной ширине 320 CSS px.

- Снимки реализации — `/Users/a1/.codex/visualizations/2026/11/06/01a1b18b-2f23-73f3-a841-47b4cabb5634/mono-navbar-desktop.jpg`, `mono-navbar-light.jpg` и `mono-navbar-mobile.jpg` в той же папке.
- В `mono-navbar-comparison.png` в этой же папке исходная шапка 2828 × 104 px приведена к ширине реализации 1280 px. Фрагменты логотипа показаны отдельно в сопоставимом масштабе. Размер области реализации на десктопном снимке 1280 × 92 px, на мобильном 320 × 88 px.
- Форма букв, круглое ушко и оба зубца ключа совпадают с выбранным исходником. Логотип выделен из снимка 342 × 116 px в прозрачный ресурс 263 × 55 px. В шапке он занимает 130 × 27 CSS px, на самом узком экране 86 × 18 CSS px. В обеих темах заливка `#f6df63`, на светлом фоне тонкий тёмный контур помогает различить буквы.
- Навигация сохраняет читаемые подписи и вертикальное выравнивание. «Войти» занимает правую позицию прежнего действия, на мобильном отображается в виде жёлтой кнопки. При 320 px шапка помещается по ширине.
- Проверены переключение темы и переход «Войти» на существующий экран авторизации `/ru/auth`. Ошибок в консоли при проверке не обнаружено.

final result: passed
