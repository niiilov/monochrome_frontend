import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Info, X } from "@phosphor-icons/react";
import { sampleDataset } from "./digest-api";
import { dashboardSections, pageHints, type HintSection } from "./sections";

const hintKeyPrefix = "mono-hidden-hint-";

export function PageHint({ section, baseHref, onDismiss }: {
  section: HintSection;
  baseHref: string;
  onDismiss: () => void;
}) {
  const storageKey = hintKeyPrefix + section;
  const [visible, setVisible] = useState(false);
  const hint = pageHints[section];

  useEffect(() => {
    try {
      setVisible(localStorage.getItem(storageKey) !== "true");
    } catch {
      setVisible(true);
    }
  }, [storageKey]);

  function dismiss() {
    try {
      localStorage.setItem(storageKey, "true");
    } catch {}
    setVisible(false);
    onDismiss();
  }

  if (!visible) return null;
  return (
    <aside className="dash-hint" aria-label="Подсказка к странице">
      <Info size={18} weight="bold" aria-hidden="true" />
      <div>
        {hint.title && <strong>{hint.title}</strong>}
        <p>{hint.text}</p>
        {hint.anchor && <Link href={baseHref + "/guide#" + hint.anchor}>Подробнее в инструкции</Link>}
      </div>
      <button type="button" onClick={dismiss} aria-label="Закрыть подсказку">
        <X size={17} aria-hidden="true" />
      </button>
    </aside>
  );
}

const results = [
  ["digest", "Подборка до пяти событий. Проверьте дату, цифры и оговорки по ссылкам под карточкой."],
  ["journal", "Все входные публикации, даже если выпуск пуст. Включённая публикация вошла в выпуск, объединённая описывает то же событие, у исключённой указана причина. Одинаковый номер группы связывает публикации об одном событии."],
  ["post", "Короткая версия для канала или чата. Сверьте список событий и ссылки с дайджестом. Готовый текст можно скопировать."],
  ["email", "Предпросмотр письма с темой, периодом и содержанием выпуска."],
  ["report", "Сведения об обработке. Здесь видно, какой набор и период обработаны, сколько материалов и событий получилось и есть ли замечания проверки."],
] as const;

export function DashboardGuide({ baseHref }: { baseHref: string }) {
  const launchHref = baseHref + "#run-settings";
  const [hintFeedback, setHintFeedback] = useState("");

  function restoreHints() {
    try {
      for (const section of Object.keys(pageHints)) {
        localStorage.removeItem(hintKeyPrefix + section);
      }
      setHintFeedback("Подсказки снова будут видны на страницах.");
    } catch {
      setHintFeedback("Хранилище браузера недоступно.");
    }
  }

  return (
    <div className="dash-guide">
      <section className="dash-panel dash-guide-intro">
        <h2>Что здесь можно сделать</h2>
        <p>Загрузить публикации о кибербезопасности и собрать из них выпуск за сутки. MONO отбирает события, объединяет сообщения об одном инциденте и сохраняет ссылки. Вы проверяете подборку и забираете готовые материалы для коллег или партнёров.</p>
        <nav className="dash-guide-index" aria-label="Разделы инструкции">
          <a href="#first-run">Первый запуск</a>
          <a href="#read-results">Где смотреть результат</a>
          <a href="#own-data">Свой набор публикаций</a>
          <a href="#check-article">Как проверить обработку</a>
          <a href="#share">Выгрузка и письмо</a>
        </nav>
      </section>
      <section className="dash-panel dash-guide-steps" id="first-run">
        <h2>Соберите первый выпуск</h2>
        <ol>
          <li>
            <span className="dash-event-index" aria-hidden="true">01</span>
            <div>
              <h3>Оставьте учебный файл и время</h3>
              <p>Откройте «Главное». Учебный набор <code>{sampleDataset}</code> уже выбран. Поле «Конец периода» задаёт, за какие сутки смотреть новости. Для учебного набора оставьте 7 ноября 2026, 12:00 МСК.</p>
              <Link className="dash-button dash-button-primary" href={launchHref}>
                К первому запуску <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </li>
          <li>
            <span className="dash-event-index" aria-hidden="true">02</span>
            <div>
              <h3>Нажмите «Собрать дайджест»</h3>
              <p>Дождитесь завершения обработки. Под формой появится «Последний выпуск» с кнопками и статистикой.</p>
            </div>
          </li>
          <li>
            <span className="dash-event-index" aria-hidden="true">03</span>
            <div>
              <h3>Откройте выпуск и журнал</h3>
              <p>Если в выпуске есть события, сверьте одно из них с источником. Если событий 0, нажмите «Посмотреть причины в журнале». В тестовом режиме учебный выпуск может быть пустым. В нём можно проверить загрузку, журнал и скачивание материалов. Для оценки отбора нужен сервер с подключённой моделью.</p>
            </div>
          </li>
        </ol>
      </section>
      <section className="dash-panel dash-guide-intro" id="read-results">
        <h2>Где смотреть результат</h2>
        <p>На «Главном» запускается обработка и видна сводка. В меню «Материалы выпуска» собраны три формата одного выпуска. «Проверка обработки» показывает, как он получился. В разделе «Сервис» находятся инструкция и профиль.</p>
        <dl className="dash-guide-list">
          {results.map(([section, description]) => (
            <div key={section}>
              <dt><Link href={baseHref + "/" + section}>{dashboardSections[section]}</Link></dt>
              <dd>{description}</dd>
            </div>
          ))}
        </dl>
        <p>Вкладка показывает последний завершённый выпуск. Чтобы сохранить его перед следующим запуском, скачайте материалы.</p>
      </section>
      <section className="dash-panel dash-guide-intro" id="own-data">
        <h2>Подготовьте свой набор публикаций</h2>
        <p>Для JSON соберите записи в массив, для JSONL поместите по записи на строку, для CSV используйте те же имена полей в заголовке. Максимальный размер файла — 8 МБ.</p>
        <dl className="dash-guide-list">
          <div><dt><code>id</code></dt><dd>Уникальный номер или код публикации, например <code>news-01</code>.</dd></div>
          <div><dt><code>title</code>, <code>text</code></dt><dd>Заголовок и текст с фактами, которые можно сверить.</dd></div>
          <div><dt><code>source</code>, <code>url</code></dt><dd>Название источника и ссылка на публикацию.</dd></div>
          <div><dt><code>published_at</code></dt><dd>Дата, время и часовой пояс. Пример <code>2026-11-07T10:00:00+03:00</code>.</dd></div>
        </dl>
        <p>В примере вымышленные публикации за 7 ноября 2026. Чтобы проверить загрузку, выберите этот файл на «Главном» и оставьте конец периода 7 ноября 2026, 12:00 МСК. Для своего файла выберите конец периода так, чтобы даты нужных публикаций попали в предыдущие 24 часа.</p>
        <a className="dash-guide-link" href="/examples/mono-publications.json" download>Скачать пример JSON</a>
      </section>
      <section className="dash-panel dash-guide-intro" id="check-article">
        <h2>Проверьте, как сервис обработает новую публикацию</h2>
        <p>После первого выпуска откройте «Журнал» и нажмите «Добавить публикацию». В диалоге указан набор, который будет обработан повторно. Введите эти данные и оставьте предложенное время публикации.</p>
        <dl className="dash-guide-list">
          <div><dt>Заголовок</dt><dd>Выставка бытовых приборов</dd></div>
          <div><dt>Источник</dt><dd>Тестовый источник</dd></div>
          <div><dt>Текст</dt><dd>Выставка бытовых приборов пройдёт в субботу.</dd></div>
        </dl>
        <p>Нажмите «Добавить и перезапустить». Когда обработка завершится, в поиске журнала введите «Тестовый источник». Ожидаемый результат — статус «исключён», поскольку материал вне темы.</p>
        <p>Для проверки дублей с подключённой моделью возьмите событие из готового выпуска и добавьте ещё одну публикацию о том же инциденте. В журнале проверьте статус «объединён» и общую группу. В дайджесте событие должно остаться одним пунктом.</p>
        <Link className="dash-guide-link" href={baseHref + "/journal"}>Открыть журнал <ArrowRight size={14} aria-hidden="true" /></Link>
      </section>
      <section className="dash-panel dash-guide-intro" id="share">
        <h2>Заберите файлы или проверьте письмо</h2>
        <p>На любой странице готового выпуска нажмите «Скачать материалы», затем «Скачать ZIP». В архиве будут дайджест, короткий пост, письмо, журнал и отчёт.</p>
        <p>Добавьте получателей в разделе «Рассылка» и назначьте им статус «Отправлять». Затем откройте готовое «Письмо» и нажмите «Отправить дайджест». Можно отправить всем или выбранным адресам. Для проверки без доставки включите соответствующий флажок.</p>
        <Link className="dash-guide-link" href={baseHref + "/email"}>К предпросмотру письма <ArrowRight size={14} aria-hidden="true" /></Link>
      </section>
      <div className="dash-inline">
        <button className="dash-button" type="button" onClick={restoreHints}>Снова показать подсказки</button>
        {hintFeedback && <p role="status">{hintFeedback}</p>}
      </div>
    </div>
  );
}
