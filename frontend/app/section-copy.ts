import type { Locale } from "./locales";

type Entry = [title: string, description: string];
type SectionCopy = {
  labels: [features: string, guide: string, menu: string, previous: string, next: string, details: string];
  featuresHeading: string;
  features: [Entry, Entry, Entry, Entry, Entry, Entry];
  guide: Entry;
};

export const sectionCopy: Record<Locale, SectionCopy> = {
  ru: {
    labels: ["Правила", "Старт", "Меню", "Предыдущая карточка", "Следующая карточка", "Подробнее"],
    featuresHeading: "Как MONO отбирает события",
    features: [
      ["Окно в 24 часа", "Период отсчитывается назад от заданного времени по Москве."],
      ["Одно событие, один пункт", "Перепечатки не занимают дополнительные места в выпуске. Ссылки на материалы сохраняются."],
      ["Факты со ссылками", "Даты, числа и последствия можно сверить по исходным публикациям."],
      ["Приоритет по влиянию", "События сравниваются по последствиям, масштабу и срочности для команд ИБ."],
      ["Видимые расхождения", "Если источники дают разные версии, в выпуске отражается расхождение."],
      ["Причина каждого решения", "В журнале видно, какие материалы включили, объединили или исключили и почему."],
    ],
    guide: ["Начните с набора новостей", "Задайте контрольное время по Москве. После обработки проверьте источники и выберите нужный формат выпуска."],
  },
  en: {
    labels: ["Criteria", "Get started", "Menu", "Previous card", "Next card", "Learn more"],
    featuresHeading: "How MONO selects events",
    features: [
      ["A 24-hour window", "The window ends at the chosen cutoff in Moscow time."],
      ["One item per event", "Reprints do not take up extra slots. Links to the original reports are retained."],
      ["Facts with sources", "Check dates, figures and impacts against the original reports."],
      ["Priority by impact", "Events are compared by impact, scale and urgency for security teams."],
      ["Visible disagreements", "When sources give different accounts, the edition records the discrepancy."],
      ["A reason for every decision", "The log shows which articles were included, merged or excluded and why."],
    ],
    guide: ["Start with a set of articles", "Set the cutoff in Moscow time. After processing, review the sources and choose an output format."],
  },
  de: {
    labels: ["Kriterien", "Einstieg", "Menü", "Vorherige Karte", "Nächste Karte", "Mehr erfahren"],
    featuresHeading: "Wie MONO Ereignisse auswählt",
    features: [
      ["Ein Fenster von 24 Stunden", "Der Zeitraum endet zur gewählten Uhrzeit in der Moskauer Zeitzone."],
      ["Ein Eintrag je Ereignis", "Nachdrucke belegen keinen zusätzlichen Platz. Die Links zu den Meldungen bleiben erhalten."],
      ["Fakten mit Quellen", "Daten, Zahlen und Folgen lassen sich anhand der Originalmeldungen prüfen."],
      ["Priorität nach Auswirkungen", "Folgen, Umfang und Dringlichkeit für Sicherheitsteams bestimmen die Reihenfolge."],
      ["Sichtbare Widersprüche", "Wenn Quellen unterschiedliche Angaben machen, weist die Ausgabe darauf hin."],
      ["Begründete Entscheidungen", "Das Protokoll zeigt, welche Meldungen aufgenommen, zusammengeführt oder ausgeschlossen wurden und warum."],
    ],
    guide: ["Mit einer Sammlung von Meldungen starten", "Lege den Stichtag mit Uhrzeit in der Moskauer Zeitzone fest. Prüfe danach die Quellen und wähle ein Ausgabeformat."],
  },
  fr: {
    labels: ["Critères", "Démarrer", "Menu", "Carte précédente", "Carte suivante", "En savoir plus"],
    featuresHeading: "Comment MONO sélectionne les événements",
    features: [
      ["Une fenêtre de 24 heures", "La période se termine à l’heure de référence, heure de Moscou."],
      ["Un point par événement", "Les reprises n’occupent pas de place supplémentaire. Les liens vers les articles sont conservés."],
      ["Des faits sourcés", "Les dates, chiffres et conséquences sont vérifiables dans les articles d’origine."],
      ["Priorité à l’impact", "Les événements sont comparés selon leurs conséquences, leur ampleur et l’urgence pour les équipes de sécurité."],
      ["Des divergences visibles", "Si les sources donnent des versions différentes, l’édition signale la divergence."],
      ["Chaque décision expliquée", "Le journal indique quels articles ont été retenus, regroupés ou écartés, et pourquoi."],
    ],
    guide: ["Partez d’un lot d’articles", "Définissez l’heure de référence à l’heure de Moscou. Après le traitement, vérifiez les sources et choisissez un format."],
  },
  es: {
    labels: ["Criterios", "Empezar", "Menú", "Tarjeta anterior", "Tarjeta siguiente", "Más información"],
    featuresHeading: "Cómo selecciona MONO los eventos",
    features: [
      ["Una ventana de 24 horas", "El período termina en la hora de referencia, según la hora de Moscú."],
      ["Un punto por evento", "Las republicaciones no ocupan lugares adicionales. Se conservan los enlaces a las noticias."],
      ["Hechos con fuentes", "Puedes contrastar fechas, cifras y consecuencias con las publicaciones originales."],
      ["Prioridad según el impacto", "Los eventos se comparan por sus consecuencias, alcance y urgencia para los equipos de seguridad."],
      ["Discrepancias a la vista", "Si las fuentes dan versiones distintas, la edición indica la discrepancia."],
      ["Un motivo para cada decisión", "El registro indica qué publicaciones se incluyeron, agruparon o descartaron y por qué."],
    ],
    guide: ["Empieza con un conjunto de noticias", "Indica la hora de referencia según la hora de Moscú. Después del procesamiento, revisa las fuentes y elige un formato."],
  },
  it: {
    labels: ["Criteri", "Inizia", "Menu", "Scheda precedente", "Scheda successiva", "Scopri di più"],
    featuresHeading: "Come MONO seleziona gli eventi",
    features: [
      ["Una finestra di 24 ore", "Il periodo termina all’ora di riferimento, secondo l’ora di Mosca."],
      ["Una voce per evento", "Le ripubblicazioni non occupano posti aggiuntivi. I link agli articoli vengono conservati."],
      ["Fatti con fonti", "Date, cifre e conseguenze si possono verificare negli articoli originali."],
      ["Priorità in base all’impatto", "Gli eventi si confrontano per conseguenze, portata e urgenza per i team di sicurezza."],
      ["Divergenze visibili", "Se le fonti danno versioni diverse, l’edizione indica la divergenza."],
      ["Una ragione per ogni decisione", "Il registro mostra quali articoli sono stati inclusi, raggruppati o esclusi e perché."],
    ],
    guide: ["Inizia da un insieme di articoli", "Imposta il termine del periodo secondo l’ora di Mosca. Dopo l’elaborazione, verifica le fonti e scegli un formato."],
  },
  pt: {
    labels: ["Critérios", "Começar", "Menu", "Cartão anterior", "Próximo cartão", "Saiba mais"],
    featuresHeading: "Como o MONO seleciona os eventos",
    features: [
      ["Uma janela de 24 horas", "O período termina no horário de referência, no fuso de Moscou."],
      ["Um item por evento", "Republicações não ocupam lugares adicionais. Os links para as publicações são mantidos."],
      ["Fatos com fontes", "Datas, números e consequências podem ser conferidos nas publicações originais."],
      ["Prioridade pelo impacto", "Os eventos são comparados por consequências, alcance e urgência para as equipes de segurança."],
      ["Divergências visíveis", "Se as fontes apresentarem versões diferentes, a edição aponta a divergência."],
      ["Cada decisão tem um motivo", "O registro mostra quais publicações foram incluídas, agrupadas ou excluídas e por quê."],
    ],
    guide: ["Comece com um conjunto de notícias", "Defina o horário de referência no fuso de Moscou. Depois do processamento, confira as fontes e escolha um formato."],
  },
  tr: {
    labels: ["Ölçütler", "Başlangıç", "Menü", "Önceki kart", "Sonraki kart", "Daha fazla bilgi"],
    featuresHeading: "MONO olayları nasıl seçer?",
    features: [
      ["24 saatlik pencere", "Dönem, Moskova saatine göre seçilen referans saatinde sona erer."],
      ["Her olaya tek madde", "Yeniden yayımlanan haberler fazladan yer kaplamaz. Yayın bağlantıları korunur."],
      ["Kaynaklı bilgiler", "Tarihler, sayılar ve etkiler kaynak yayınlardan kontrol edilebilir."],
      ["Etkiye göre öncelik", "Olaylar güvenlik ekipleri için sonuçlarına, kapsamına ve aciliyetine göre karşılaştırılır."],
      ["Görünür tutarsızlıklar", "Kaynaklar farklı bilgiler verirse bülten bu farkı belirtir."],
      ["Her kararın bir gerekçesi var", "Günlük, hangi yayınların dahil edildiğini, birleştirildiğini veya elendiğini ve nedenini gösterir."],
    ],
    guide: ["Bir haber kümesiyle başlayın", "Referans saatini Moskova saatine göre belirleyin. İşlemden sonra kaynakları inceleyip bir çıktı biçimi seçin."],
  },
  ar: {
    labels: ["المعايير", "البدء", "القائمة", "البطاقة السابقة", "البطاقة التالية", "اعرف المزيد"],
    featuresHeading: "كيف يختار MONO الأحداث",
    features: [
      ["فترة من 24 ساعة", "تنتهي الفترة عند الوقت المرجعي المحدد بتوقيت موسكو."],
      ["بند واحد لكل حدث", "لا تشغل إعادة النشر بنودًا إضافية. وتُحفظ روابط المقالات."],
      ["حقائق موثقة بالمصادر", "يمكن مراجعة التواريخ والأرقام والآثار في المقالات الأصلية."],
      ["الأولوية بحسب الأثر", "تُقارن الأحداث بحسب أثرها ونطاقها ومدى إلحاحها لفرق الأمن."],
      ["إظهار الاختلافات", "إذا قدّمت المصادر روايات مختلفة، يشير الموجز إلى الاختلاف."],
      ["سبب لكل قرار", "يوضح السجل المقالات التي أُدرجت أو دُمجت أو استُبعدت، والسبب وراء ذلك."],
    ],
    guide: ["ابدأ بمجموعة من الأخبار", "حدّد الوقت المرجعي بتوقيت موسكو. بعد المعالجة، راجع المصادر واختر تنسيق المخرجات."],
  },
  zh: {
    labels: ["筛选规则", "开始使用", "菜单", "上一张卡片", "下一张卡片", "了解更多"],
    featuresHeading: "MONO 如何筛选事件",
    features: [
      ["24 小时时间范围", "统计时段以莫斯科时间的参考时刻为终点。"],
      ["每起事件只列一条", "转载不占额外名额，报道链接会保留。"],
      ["事实附有来源", "可通过原始报道核对日期、数字和影响。"],
      ["按影响排序", "比较事件的影响、范围及其对安全团队的紧迫程度。"],
      ["注明来源分歧", "来源说法不一致时，简报会说明分歧。"],
      ["每项决定都有理由", "日志记录哪些报道被收录、合并或排除，以及原因。"],
    ],
    guide: ["从一组新闻报道开始", "设置莫斯科时间的参考时刻。处理完成后，核对来源并选择输出格式。"],
  },
  ja: {
    labels: ["選定基準", "使い方", "メニュー", "前のカード", "次のカード", "詳しく見る"],
    featuresHeading: "MONO の選定基準",
    features: [
      ["対象は24時間", "モスクワ時間で設定した基準時刻までの24時間が対象です。"],
      ["1件につき1項目", "転載記事で枠を埋めず、各記事へのリンクを残します。"],
      ["出典を確認できる", "日付・数値・影響を元の記事で確認できます。"],
      ["影響度で優先順位を決定", "影響、規模、セキュリティチームにとっての緊急性を比較します。"],
      ["情報の食い違いを明示", "出典ごとに説明が異なる場合は、その違いを速報に記載します。"],
      ["判断の理由を記録", "採用、統合、除外した記事とその理由をログで確認できます。"],
    ],
    guide: ["記事セットから始めましょう", "基準時刻をモスクワ時間で指定します。処理後に出典を確認し、必要な出力形式を選びます。"],
  },
};
