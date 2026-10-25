// Три языка карты: русский, итальянский, английский.
//
// Русский текст — исходник: он лежит в index.html, в app.js и в данных конвейера.
// Ключ словаря — сам русский текст, поэтому ничего переписывать в разметке не нужно:
// при смене языка модуль обходит страницу и заменяет тексты и подписи по словарю,
// а данные (сюжеты, эпохи, слои) переводятся на месте, в момент отрисовки.
//
// {фигурные скобки} — подстановка значений: t('Здание, {year} г.', { year: 1897 }).

export const LANGS = ['ru', 'it', 'en'];
export const LANG_TITLE = { ru: 'Русский', it: 'Italiano', en: 'English' };
const STORE_KEY = 'venice-lang';

const DICT = {
  it: {
    // --- шапка, поиск, заметки ---
    'Венеция': 'Venezia',
    'Здание за зданием': 'Edificio per edificio',
    'Возраст': 'Età',
    'Сюжеты': 'Storie',
    'Высоты': 'Altezze',
    'Наследие': 'Patrimonio',
    'Все Palazzo': 'Tutti i Palazzo',
    'Районы': 'Quartieri',
    'Маршруты': 'Percorsi',
    'О проекте': 'Informazioni sul progetto',
    'OpenStreetMap, ODbL 1.0, © участники OpenStreetMap.': 'OpenStreetMap, ODbL 1.0, © contributori di OpenStreetMap.',
    'OpenStreetMap: авторские права и лицензия': 'OpenStreetMap: copyright e licenza',
    '. Извлечение Венето —': '. Estrazione del Veneto —',
    'Найти здание, улицу или мост': 'Cerca un edificio, una via o un ponte',
    'Подробности': 'Dettagli',
    'Закрыть': 'Chiudi',
    'Трёхмерная модель застройки Венеции': 'Modello tridimensionale dell\'edificato di Venezia',
    'Раскрасить город по': 'Colora la città per',
    'Время': 'Tempo',
    'Воспроизвести рост города': 'Riproduci la crescita della città',
    'Здания по эпохам. Потяните, чтобы выбрать год.': 'Edifici per epoca. Trascina per scegliere l\'anno.',
    'Сегодня': 'Oggi',
    'Сегодня,': 'Oggi,',
    '11 137 зданий': '11 137 edifici',
    'Раскладываем город': 'Sto disponendo la città',
    'Не удалось построить карту.': 'Non è stato possibile costruire la mappa.',
    'Подробности — в консоли браузера (F12).': 'Dettagli nella console del browser (F12).',
    'загрузка не завершилась за 30 секунд': 'il caricamento non è finito entro 30 secondi',

    // --- заметки: обзор ---
    'Года постройки каждого венецианского дома нет ни в одном реестре. Атлас собирает возраст по зданию: из муниципальной классификации застройки, исторических реестров и OpenStreetMap.':
      'L\'anno di costruzione di ogni casa veneziana non esiste in nessun registro. L\'atlante ricostruisce l\'età edificio per edificio: dalla classificazione comunale dell\'edificato, dai registri storici e da OpenStreetMap.',
    'Что вы видите': 'Che cosa vedi',
    'Все': 'Tutti i',
    'зданий исторического центра — остров Венеции, Джудекка, Сан-Джорджо, Ла-Чертоза, Мурано и Бурано — как они стоят сегодня, каждое окрашено по эпохе застройки. Проведите по шкале времени внизу, чтобы увидеть город в любом году, или включите воспроизведение и смотрите, как он собирается.':
      'edifici del centro storico — l\'isola di Venezia, la Giudecca, San Giorgio, la Certosa, Murano e Burano — come sono oggi, ognuno colorato secondo l\'epoca di costruzione. Scorri la linea del tempo in basso per vedere la città in un anno qualsiasi, oppure avvia la riproduzione e guardala crescere.',
    'Улицы, набережные, мосты': 'Vie, fondamenta, ponti',
    'Названия улиц и набережных —': 'I nomi delle vie e delle fondamenta —',
    '— подписаны на карте и видны, когда камера подходит ближе; в поиске по имени ищутся и они, и каналы, и мосты. Отдельным слоем стоят':
      '— sono scritti sulla mappa e compaiono quando la camera si avvicina; la ricerca li trova per nome, insieme ai canali e ai ponti. Su un livello a parte stanno',
    'мостов: настил каждого показан плитой над каналом. Включите линзу «Мосты» в верхней панели, чтобы окрасить только их, и нажмите на мост, чтобы прочитать карточку.':
      'ponti: l\'impalcato di ognuno è mostrato come una lastra sopra il canale. Attiva la lente «Ponti» nella barra in alto per colorare soltanto quelli, e clicca su un ponte per leggere la sua scheda.',
    'Как здесь оказаться': 'Come muoversi',
    'Тяните карту левой кнопкой мыши — город сдвигается, как всякая карта. Правая кнопка или Shift с левой поворачивают и наклоняют его. Колесо приближает и отдаляет; над панелью карточки колесо прокручивает текст, а не карту. Щелчок по зданию открывает его карточку. Двигайте солнце по шкале или включите воспроизведение.':
      'Trascina la mappa con il tasto sinistro — la città si sposta come una mappa qualsiasi. Il tasto destro, o Shift con il sinistro, la ruotano e la inclinano. La rotella avvicina e allontana; sopra il pannello della scheda la rotella scorre il testo, non la mappa. Un clic su un edificio apre la sua scheda. Muovi il sole lungo la barra o avvia la riproduzione.',

    // --- заметки: возраст ---
    'Как известен возраст': 'Come si conosce l\'età',
    'Каждое здание несёт то лучшее свидетельство, которое о нём есть, и в карточке сказано, какое именно.':
      'Ogni edificio porta la migliore testimonianza che esiste su di lui, e nella scheda è detto quale sia.',
    'Год по документу': 'Anno da documento',
    'Год указан в самом объекте OpenStreetMap или пришёл из Wikidata. Для Венеции это редкий случай: даты в OSM есть лишь у двух десятков зданий острова.':
      'L\'anno è indicato nello stesso oggetto OpenStreetMap o arriva da Wikidata. Per Venezia è un caso raro: in OSM le date esistono solo per una ventina di edifici dell\'isola.',
    'Эпоха': 'Epoca',
    'Муниципальная классификация VPRG делит застройку города на три эпохи: preottocentesche (до 1800), ottocentesche (XIX век) и novecentesche (XX век). Это интервал, а не год, и в карточке он показан как интервал.':
      'La classificazione comunale VPRG divide l\'edificato in tre epoche: preottocentesche (prima del 1800), ottocentesche (XIX secolo) e novecentesche (XX secolo). È un intervallo, non un anno, e nella scheda è mostrato come intervallo.',
    'Перестроено': 'Ricostruito',
    'Классы': 'Le classi',
    'и составные коды помечают единицы, частично изменённые, слитые или перестроенные. Их нельзя показывать как сохранившиеся старые дома.':
      'e i codici composti indicano unità parzialmente modificate, accorpate o ricostruite. Non si possono mostrare come case antiche conservate.',
    'Неизвестно': 'Ignoto',
    'Для части застройки муниципальной классификации нет вовсе — прежде всего на Мурано и Бурано. Такие здания показаны серым, и год постройки у них неизвестен.':
      'Per una parte dell\'edificato la classificazione comunale non esiste affatto — soprattutto a Murano e Burano. Questi edifici sono mostrati in grigio e il loro anno di costruzione è ignoto.',
    'Оценки на карте бледнее, а в карточке написано, откуда они взялись. Читайте их как период, а не как дату.':
      'Le stime sulla mappa sono più pallide, e nella scheda è scritto da dove vengono. Leggile come un periodo, non come una data.',

    // --- заметки: высоты ---
    'Из тега': 'Dal tag',
    ', где он есть; иначе по числу этажей; иначе взята медиана измеренных зданий той же эпохи, и это прямо помечено в карточке. Крыши и надстройки собраны из частей':
          ', dove c\'è; altrimenti dal numero di piani; altrimenti è presa la mediana degli edifici misurati della stessa epoca, e questo è indicato apertamente nella scheda. Tetti e sopraelevazioni sono composti dalle parti',
        ', где их нанёс OSM.': ', dove OSM le ha tracciate.',

    // --- заметки: данные ---
    'Данные': 'Dati',
    'Классификация застройки': 'Classificazione dell\'edificato',
    'VPRG Città Antica, Comune di Venezia: 15 584 единицы, 56 классов. Получена через публичные картографические сервисы города.':
      'VPRG Città Antica, Comune di Venezia: 15 584 unità, 56 classi. Ottenuta tramite i servizi cartografici pubblici della città.',
    'Геометрия, адреса, части, улицы': 'Geometria, indirizzi, parti, vie',
    'OpenStreetMap, ODbL 1.0, © участники OpenStreetMap. Извлечение Венето —':
      'OpenStreetMap, ODbL 1.0, © contributori di OpenStreetMap. Estrazione del Veneto —',
    'Границы': 'Confini',
    'остров Венеции (relation 4817103) и исторический центр Венеция-Мурано-Бурано (relation 6628638), OpenStreetMap.':
      'l\'isola di Venezia (relation 4817103) e il centro storico Venezia-Murano-Burano (relation 6628638), OpenStreetMap.',
    'Имена, фотографии, статьи': 'Nomi, fotografie, voci',
    'Wikidata (CC0), Википедия (CC BY-SA) и Викисклад; у каждой фотографии указан автор и лицензия. Связь идёт по тегу':
      'Wikidata (CC0), Wikipedia (CC BY-SA) e Wikimedia Commons; per ogni fotografia sono indicati autore e licenza. Il collegamento passa per il tag',
    '; где тега нет, рядом со зданием ищется статья, и такая связь помечена как предположение.':
      '; dove il tag manca, si cerca una voce vicino all\'edificio, e quel collegamento è contrassegnato come ipotesi.',
    'Топографические выпуски Венето': 'Edizioni topografiche del Veneto',
    '1987–2010 годов и исторические реестры 1740, 1808 и 1857 годов сохранены в проекте; в этой сборке возраст по ним ещё не размечался.':
      'del 1987–2010 e i registri storici del 1740, 1808 e 1857 sono conservati nel progetto; in questa edizione l\'età non è ancora stata ricavata da essi.',
    'Чего здесь нет': 'Che cosa qui non c\'è',
    'Точных годов постройки. Класс VPRG описывает типологию и сохранность, а не дату;':
      'Gli anni esatti di costruzione. La classe VPRG descrive tipologia e conservazione, non una data;',
    'в этих данных — дата решения научной комиссии (2000–2013 годы), а не год постройки. Исторические реестры фиксируют год наблюдения, а не строительства. Материковая часть города — Местре и Маргера — в атлас не входит.':
      'in questi dati è la data della delibera della commissione scientifica (2000–2013), non l\'anno di costruzione. I registri storici registrano l\'anno dell\'osservazione, non della costruzione. La parte di terraferma della città — Mestre e Marghera — non è compresa nell\'atlante.',
    'Из чего это сделано': 'Con che cosa è fatto',
    'Данные подготовлены собственным конвейером, а показываются движком':
      'I dati sono preparati da un nostro processo di elaborazione e mostrati dal motore di',
    'Амира Мараши (лицензия MIT), который продолжает': 'Amir Marashi (licenza MIT), che continua',
    'LAYRS: Амстердам': 'LAYRS: Amsterdam',
    'Алекса Баракова и': 'Alex Barakov e',
    '«Париж, здание за зданием»': '«Parigi, edificio per edificio»',
    'Александра Богачёва.': 'Alexander Bogachev.',
    'Некоммерческий проект: данные города, показанные как есть. Атрибуция обязательна для всех источников, перечисленных выше.':
      'Progetto senza fini di lucro: dati della città mostrati così come sono. L\'attribuzione è obbligatoria per tutte le fonti elencate sopra.',
    'Код и конвейер данных на GitHub': 'Codice e processo dei dati su GitHub',

    // --- данные конвейера: сюжеты, эпохи, слои ---
    'Сооружения': 'Strutture',
    'Мосты': 'Ponti',
    'Мосты, храмы, монастыри': 'Ponti, templi, monasteri',
    '465 мостовых сооружений, нанесённых в OpenStreetMap отдельными площадками: настил показан плитой над каналом. У 375 мостов есть имя — от Понте-деи-Соспири до Понте-делла-Коституцьоне; имена видны на карте и находятся через поиск.':
      '465 manufatti da ponte, tracciati in OpenStreetMap come superfici proprie: l\'impalcato è mostrato come una lastra sopra il canale. 375 ponti hanno un nome — dal Ponte dei Sospiri al Ponte della Costituzione; i nomi si vedono sulla mappa e si trovano con la ricerca.',
    'В OSM у венецианских мостов нет ни высот, ни дат постройки: высота настила принята за 3 метра, год не указан. Это сооружение, а не здание.':
      'In OSM i ponti veneziani non hanno né altezze né date di costruzione: l\'altezza dell\'impalcato è assunta in 3 metri, l\'anno non è indicato. È un manufatto, non un edificio.',
    'Датировка': 'Datazione',
    'Год постройки неизвестен': 'Anno di costruzione ignoto',
    'Класс описывает типологию и сохранность, а не дату постройки.':
      'La classe descrive tipologia e conservazione, non la data di costruzione.',
    'Муниципальная классификация VPRG делит застройку на три эпохи: preottocentesche, ottocentesche, novecentesche — и отдельно помечает перестроенные, слитые и частично изменённые единицы. Это эпоха, а не год.':
      'La classificazione comunale VPRG divide l\'edificato in tre epoche: preottocentesche, ottocentesche, novecentesche — e segnala a parte le unità ricostruite, accorpate e parzialmente modificate. È un\'epoca, non un anno.',
    'Форма': 'Forma',
    'Дворы, части и крыши': 'Corti, parti e tetti',
    'У части зданий есть внутренние дворы (кольца-отверстия в контуре) и отдельные объёмные части building:part с собственными высотами — ими заданы крыши и надстройки, которые видно с воздуха.':
      'Alcuni edifici hanno corti interne (anelli-buco nel contorno) e parti volumetriche building:part con altezze proprie: da esse vengono tetti e sopraelevazioni che si vedono dall\'alto.',
    'Части есть только там, где их нанёс OSM; у остальных зданий одна призма.':
      'Le parti esistono solo dove OSM le ha tracciate; gli altri edifici sono un unico prisma.',
    'Фотографии и статьи': 'Fotografie e voci',
    'Связи со зданиями идут по тегу wikidata: от него к статьям Википедии и файлам Викисклада с автором и лицензией. Где тега нет, рядом со зданием ищется статья, и такая связь помечена как предположение.':
      'I collegamenti con gli edifici passano per il tag wikidata: da lì alle voci di Wikipedia e ai file di Wikimedia Commons con autore e licenza. Dove il tag manca, si cerca una voce vicino all\'edificio, e quel collegamento è contrassegnato come ipotesi.',
    'Ближайшая статья не доказывает, что она описывает это здание.':
      'Una voce vicina non prova che descriva proprio questo edificio.',
    'География': 'Geografia',
    'Граница острова взята из OpenStreetMap (relation 4817103), исторический центр — муниципалитет Venezia-Murano-Burano (relation 6628638). Слой показывает, какие здания стоят на самом острове, а какие на Джудекке, Сан-Джорджо, Мурано и Бурано.':
      'Il confine dell\'isola viene da OpenStreetMap (relation 4817103), il centro storico dal comune Venezia-Murano-Burano (relation 6628638). Il livello mostra quali edifici stanno sull\'isola vera e quali alla Giudecca, a San Giorgio, a Murano e a Burano.',
    'Остров Венеции и лагуна': 'L\'isola di Venezia e la laguna',
    'Остров и центр — разные области: остров входит в центр, но не наоборот.':
      'Isola e centro sono due aree diverse: l\'isola è dentro il centro, non viceversa.',
    'вся история города': 'tutta la storia della città',
    'как стоят сегодня': 'come sono oggi',
    'по данным OSM': 'secondo i dati OSM',
    'до 1800 / XIX / XX век': 'fino al 1800 / XIX / XX secolo',
    'Wikimedia': 'Wikimedia',
    'OpenStreetMap, ODbL 1.0': 'OpenStreetMap, ODbL 1.0',
    'OpenStreetMap, man_made=bridge, ODbL 1.0': 'OpenStreetMap, man_made=bridge, ODbL 1.0',
    'VPRG Città Antica, Comune di Venezia': 'VPRG Città Antica, Comune di Venezia',
    'Wikidata, Wikipedia, Wikimedia Commons': 'Wikidata, Wikipedia, Wikimedia Commons',

    // --- периоды, слои, группы ---
    'До 1800 — средневековое ядро и Ренессанс': 'Fino al 1800 — nucleo medievale e Rinascimento',
    '1800–1899 — от наполеоновской эпохи до объединения': '1800–1899 — dall\'età napoleonica all\'unità',
    '1900– — XX век и современность': '1900– — XX secolo e oggi',
    'До 1800': 'Fino al 1800',
    'XIX век': 'XIX secolo',
    'XX век': 'XX secolo',
    'Остров Венеции': 'Isola di Venezia',
    'Прочие острова центра': 'Altre isole del centro',
    'Перестроено или слито': 'Ricostruito o accorpato',
    'Класс отсутствует': 'Classe assente',
    'Есть двор': 'Con corte',
    'Есть объёмные части': 'Con parti volumetriche',
    'Есть фотография': 'Con fotografia',
    'Есть статья': 'Con voce',
    'Связь предположительная': 'Collegamento ipotetico',
    'Объект наследия (тег OSM)': 'Bene culturale (tag OSM)',

    // --- карточка здания ---
    'год неизвестен': 'anno ignoto',
    'мост, год неизвестен': 'ponte, anno ignoto',
    'Мост': 'Ponte',
    'Здание': 'Edificio',
    'Здание, {year} г.': 'Edificio, {year}',
    'Здание, год неизвестен': 'Edificio, anno ignoto',
    'Канал, лагуна': 'Canale, laguna',
    'Район': 'Quartiere',
    'Улица, набережная': 'Via, fondamenta',
    'Ничего с таким названием на карте нет.': 'Sulla mappa non c\'è nulla con questo nome.',
    '{n} зданий': '{n} edifici',
    'на карте': 'sulla mappa',
    'здание или сооружение': 'edificio o manufatto',
    'здания и сооружения': 'edifici e manufatti',
    'зданий и сооружений': 'edifici e manufatti',
    'Сегодня, ': 'Oggi, ',
    'до 1800 года': 'prima del 1800',
    'неизвестен': 'ignoto',
    'эпоха': 'epoca',
    'оценка': 'stima',
    'измерено по тегу OSM': 'misurata dal tag OSM',
    'по числу этажей OSM': 'dal numero di piani OSM',
    'принята для моста: в OSM высот нет': 'assunta per il ponte: in OSM non ci sono altezze',
    'высота ÷ 3 м': 'altezza ÷ 3 m',
    'OpenStreetMap': 'OpenStreetMap',
    'высота ÷ 3 м.': 'altezza ÷ 3 m.',
    'Сооружение': 'Manufatto',
    'настил над каналом, OSM': 'impalcato sopra il canale, OSM',
    'мост с застройкой, OSM': 'ponte con edifici sopra, OSM',
    'Высота': 'Altezza',
    'Этажи': 'Piani',
    'Архитектор': 'Architetto',
    'Архитекторы': 'Architetti',
    'Стиль': 'Stile',
    'Охрана': 'Tutela',
    'Объект наследия': 'Bene culturale',
    'Охранная зона': 'Zona di tutela',
    'Дата в Wikidata': 'Data in Wikidata',
    'Из Википедии': 'Da Wikipedia',
    'Читать далее': 'Leggi tutto',
    'Статья в Википедии': 'Voce su Wikipedia',
    'В сюжетах': 'Nelle storie',
    'Источники': 'Fonti',
    'Source': 'Fonte',
    'Wikipedia': 'Wikipedia',
    'Wikidata': 'Wikidata',
    'Wikimedia Commons': 'Wikimedia Commons',
    'Год указан в {src}.': 'L\'anno è indicato in {src}.',
    'классификации VPRG': 'classificazione VPRG',
    'источника': 'fonte',
    'Точного года нет. Муниципальная классификация VPRG относит здание к эпохе «{era}», то есть к интервалу {range}. Формулировка класса записана в таблице свидетельств.':
      'Non esiste un anno esatto. La classificazione comunale VPRG attribuisce l\'edificio all\'epoca «{era}», cioè all\'intervallo {range}. La formulazione della classe è registrata nella tabella delle testimonianze.',
    'Год постройки неизвестен: муниципальной классификации для этого здания нет, и даты в OSM тоже нет. Здание показано серым.':
      'L\'anno di costruzione è ignoto: per questo edificio non esiste una classificazione comunale, e in OSM non c\'è alcuna data. L\'edificio è mostrato in grigio.',
    'Это мостовое сооружение, а не здание: в OpenStreetMap для венецианских мостов нет ни даты постройки, ни высоты. Настил показан плитой на принятой высоте, год не указан.':
      'Questo è un manufatto da ponte, non un edificio: in OpenStreetMap i ponti veneziani non hanno né data di costruzione né altezza. L\'impalcato è mostrato come lastra a un\'altezza assunta, l\'anno non è indicato.',

    // --- районы, маршруты, прочее ---
    'All suburbs': 'Tutti i quartieri',
    'Suburb': 'Quartiere',
    'Water': 'Acqua',
    'Street': 'Via',
    'not started': 'non iniziato',
    'Walk again': 'Rifai il percorso',
    'Carry on': 'Continua',
    'Районы города': 'Quartieri della città',
    'Маршруты по городу': 'Percorsi in città',
    'Фото': 'Foto',
    'зданий': 'edifici',
    'Только {name}': 'Solo {name}',
    'измерено по Викиданным': 'misurata da Wikidata',
    'Измерена муниципальной съёмкой города 2010 года: у большинства зданий центра карниз измерен относительно собственного основания здания. Где съёмки нет — тег': 'Misurata dal rilievo comunale del 2010: per la maggior parte degli edifici del centro la quota di gronda è misurata rispetto alla base dell’edificio stesso. Dove il rilievo manca — il tag',
    ', иначе по числу этажей, иначе медиана измеренных зданий той же эпохи. Источник высоты написан в карточке. Крыши и надстройки собраны из частей': ', altrimenti dal numero di piani, altrimenti dalla mediana degli edifici misurati della stessa epoca. La fonte dell’altezza è scritta nella scheda. Tetti e sopraelevazioni sono composti dalle parti',
    'Высоты зданий': 'Altezze degli edifici',
    'Comune di Venezia, топографический лот 2010 года, слой UN_VOL: объёмные части с измеренными отметками основания, карниза и конька, запись обновлена 31.03.2013. Условия использования архива не установлены.': 'Comune di Venezia, lotto topografico 2010, strato UN_VOL: parti volumetriche con quote misurate di base, gronda e colmo, record aggiornato il 31.03.2013. Le condizioni d’uso dell’archivio non sono stabilite.',
    'измерено съёмкой города 2010 года': 'misurata dal rilievo comunale del 2010',
    'Год по статье': 'Anno dalla voce',
    'статье итальянской Википедии': 'voce di Wikipedia in italiano',
    'Годы постройки отдельных зданий': 'Anni di costruzione di singoli edifici',
    'У части зданий год назван в статье итальянской Википедии. Такой год взят только там, где Викиданные молчат, и показан вместе с фразой, из которой он извлечён. Фраза иногда говорит о части комплекса — о портале, приделе или надстройке, — поэтому относитесь к такому году как к подсказке, а не как к записи реестра.': 'Per una parte degli edifici l’anno è indicato nella voce di Wikipedia in italiano. Tale anno è preso solo dove Wikidata tace ed è mostrato insieme alla frase da cui è tratto. La frase a volte parla di una parte del complesso — un portale, una cappella o una sopraelevazione — quindi considerate quell’anno un indizio, non un dato di registro.',
    'статьи итальянской Википедии, CC BY-SA 4.0: берутся только там, где Викиданные молчат, и только вместе с фразой-свидетельством. Спорные случаи на карту не выводятся.': 'voci di Wikipedia in italiano, CC BY-SA 4.0: presi solo dove Wikidata tace e solo insieme alla frase che li attesta. I casi controversi non compaiono sulla mappa.',
    'Охранный статус': 'Status di tutela',
    'Охранный статус (Wikidata)': 'Status di tutela (Wikidata)',
    'найдена по координатам': 'trovata per coordinate',
    'Высота в Wikidata': 'Altezza in Wikidata',
    'Связь': 'Collegamento',
    'Место': 'Luogo',
    'Слои': 'Livelli',
    'Все слои': 'Tutti i livelli',
    'объектов': 'oggetti',
    'Места и их истории': 'Luoghi e le loro storie',
    'Слои карты: выберите слой, чтобы подсветить его объекты и прочитать о них.': 'Livelli della mappa: scegline uno per mettere in evidenza i suoi oggetti e leggerne la storia.',
    'All stories': 'Tutte le storie',
    'Back to the walk': 'Torna al percorso',
    'State Heritage Register': 'State Heritage Register',
  },

  en: {
    // --- masthead, search, notes ---
    'Венеция': 'Venice',
    'Здание за зданием': 'Building by building',
    'Возраст': 'Age',
    'Сюжеты': 'Stories',
    'Высоты': 'Heights',
    'Наследие': 'Heritage',
    'Все Palazzo': 'All Palazzo',
    'Районы': 'Districts',
    'Маршруты': 'Walks',
    'О проекте': 'About the project',
    'OpenStreetMap, ODbL 1.0, © участники OpenStreetMap.': 'OpenStreetMap, ODbL 1.0, © OpenStreetMap contributors.',
    'OpenStreetMap: авторские права и лицензия': 'OpenStreetMap: copyright and license',
    '. Извлечение Венето —': '. Veneto extract —',
    'Найти здание, улицу или мост': 'Find a building, a street or a bridge',
    'Подробности': 'Details',
    'Закрыть': 'Close',
    'Трёхмерная модель застройки Венеции': 'A three-dimensional model of Venice, building by building',
    'Раскрасить город по': 'Colour the city by',
    'Время': 'Time',
    'Воспроизвести рост города': 'Play the city\'s growth',
    'Здания по эпохам. Потяните, чтобы выбрать год.': 'Buildings by era. Drag to choose a year.',
    'Сегодня': 'Today',
    'Сегодня,': 'Today,',
    '11 137 зданий': '11 137 buildings',
    'Раскладываем город': 'Laying out the city',
    'Не удалось построить карту.': 'The map could not be built.',
    'Подробности — в консоли браузера (F12).': 'Details in the browser console (F12).',
    'загрузка не завершилась за 30 секунд': 'loading did not finish within 30 seconds',

    // --- notes: overview ---
    'Года постройки каждого венецианского дома нет ни в одном реестре. Атлас собирает возраст по зданию: из муниципальной классификации застройки, исторических реестров и OpenStreetMap.':
      'No register holds the year every Venetian house was built. The atlas assembles the age building by building: from the city\'s classification of its buildings, from historical registers and from OpenStreetMap.',
    'Что вы видите': 'What you see',
    'Все': 'All',
    'зданий исторического центра — остров Венеции, Джудекка, Сан-Джорджо, Ла-Чертоза, Мурано и Бурано — как они стоят сегодня, каждое окрашено по эпохе застройки. Проведите по шкале времени внизу, чтобы увидеть город в любом году, или включите воспроизведение и смотрите, как он собирается.':
      'the buildings of the historic centre — the island of Venice, Giudecca, San Giorgio, La Certosa, Murano and Burano — as they stand today, each coloured by the era it was built in. Drag the timeline at the bottom to see the city in any year, or press play and watch it gather.',
    'Улицы, набережные, мосты': 'Streets, waterfronts, bridges',
    'Названия улиц и набережных —': 'The names of streets and waterfronts —',
    '— подписаны на карте и видны, когда камера подходит ближе; в поиске по имени ищутся и они, и каналы, и мосты. Отдельным слоем стоят':
      '— are labelled on the map and appear as the camera comes closer; the search finds them by name, along with the canals and the bridges. On a layer of their own stand',
    'мостов: настил каждого показан плитой над каналом. Включите линзу «Мосты» в верхней панели, чтобы окрасить только их, и нажмите на мост, чтобы прочитать карточку.':
      'bridges: each deck is drawn as a slab over the canal. Switch on the «Bridges» lens in the top bar to colour only them, and click a bridge to read its card.',
    'Как здесь оказаться': 'How to get around',
    'Тяните карту левой кнопкой мыши — город сдвигается, как всякая карта. Правая кнопка или Shift с левой поворачивают и наклоняют его. Колесо приближает и отдаляет; над панелью карточки колесо прокручивает текст, а не карту. Щелчок по зданию открывает его карточку. Двигайте солнце по шкале или включите воспроизведение.':
      'Drag the map with the left button — the city slides like any map. The right button, or Shift with the left, turns and tilts it. The wheel zooms in and out; over a card panel the wheel scrolls the text, not the map. Click a building to open its card. Move the sun along the bar, or press play.',

    // --- notes: age ---
    'Как известен возраст': 'How the age is known',
    'Каждое здание несёт то лучшее свидетельство, которое о нём есть, и в карточке сказано, какое именно.':
      'Every building carries the best evidence that exists about it, and the card says which.',
    'Год по документу': 'Year from a document',
    'Год указан в самом объекте OpenStreetMap или пришёл из Wikidata. Для Венеции это редкий случай: даты в OSM есть лишь у двух десятков зданий острова.':
      'The year is written in the OpenStreetMap object itself or comes from Wikidata. For Venice this is rare: OSM holds dates for only about twenty buildings on the island.',
    'Эпоха': 'Era',
    'Муниципальная классификация VPRG делит застройку города на три эпохи: preottocentesche (до 1800), ottocentesche (XIX век) и novecentesche (XX век). Это интервал, а не год, и в карточке он показан как интервал.':
      'The city\'s VPRG classification divides the buildings into three eras: preottocentesche (before 1800), ottocentesche (the 19th century) and novecentesche (the 20th century). It is an interval, not a year, and the card shows it as an interval.',
    'Перестроено': 'Rebuilt',
    'Классы': 'The classes',
    'и составные коды помечают единицы, частично изменённые, слитые или перестроенные. Их нельзя показывать как сохранившиеся старые дома.':
      'and the compound codes mark units that were partly altered, merged or rebuilt. They cannot be shown as old houses that survived.',
    'Неизвестно': 'Unknown',
    'Для части застройки муниципальной классификации нет вовсе — прежде всего на Мурано и Бурано. Такие здания показаны серым, и год постройки у них неизвестен.':
      'For part of the fabric the city\'s classification does not exist at all — above all on Murano and Burano. Those buildings are drawn grey, and their year of construction is unknown.',
    'Оценки на карте бледнее, а в карточке написано, откуда они взялись. Читайте их как период, а не как дату.':
      'Estimates are paler on the map, and the card says where they came from. Read them as a period, not as a date.',

    // --- notes: heights ---
    'Из тега': 'From the tag',
    ', где он есть; иначе по числу этажей; иначе взята медиана измеренных зданий той же эпохи, и это прямо помечено в карточке. Крыши и надстройки собраны из частей':
      ', where it exists; otherwise from the number of floors; otherwise the median of measured buildings of the same era is taken, and the card says so plainly. Roofs and upper storeys are built from the parts',
    ', где их нанёс OSM.': 'that OSM mapped.',

    // --- notes: data ---
    'Данные': 'Data',
    'Классификация застройки': 'Building classification',
    'VPRG Città Antica, Comune di Venezia: 15 584 единицы, 56 классов. Получена через публичные картографические сервисы города.':
      'VPRG Città Antica, Comune di Venezia: 15 584 units, 56 classes. Taken from the city\'s public mapping services.',
    'Геометрия, адреса, части, улицы': 'Geometry, addresses, parts, streets',
    'OpenStreetMap, ODbL 1.0, © участники OpenStreetMap. Извлечение Венето —':
      'OpenStreetMap, ODbL 1.0, © OpenStreetMap contributors. Veneto extract —',
    'Границы': 'Boundaries',
    'остров Венеции (relation 4817103) и исторический центр Венеция-Мурано-Бурано (relation 6628638), OpenStreetMap.':
      'the island of Venice (relation 4817103) and the historic centre Venezia-Murano-Burano (relation 6628638), OpenStreetMap.',
    'Имена, фотографии, статьи': 'Names, photographs, articles',
    'Wikidata (CC0), Википедия (CC BY-SA) и Викисклад; у каждой фотографии указан автор и лицензия. Связь идёт по тегу':
      'Wikidata (CC0), Wikipedia (CC BY-SA) and Wikimedia Commons; every photograph carries its author and licence. The link runs through the tag',
    '; где тега нет, рядом со зданием ищется статья, и такая связь помечена как предположение.':
      '; where the tag is absent, an article is looked for near the building, and that link is marked as a guess.',
    'Топографические выпуски Венето': 'Topographic releases of the Veneto',
    '1987–2010 годов и исторические реестры 1740, 1808 и 1857 годов сохранены в проекте; в этой сборке возраст по ним ещё не размечался.':
      'from 1987–2010 and the historical registers of 1740, 1808 and 1857 are kept in the project; in this edition the age has not yet been read from them.',
    'Чего здесь нет': 'What is not here',
    'Точных годов постройки. Класс VPRG описывает типологию и сохранность, а не дату;':
      'Exact years of construction. The VPRG class describes typology and survival, not a date;',
    'в этих данных — дата решения научной комиссии (2000–2013 годы), а не год постройки. Исторические реестры фиксируют год наблюдения, а не строительства. Материковая часть города — Местре и Маргера — в атлас не входит.':
      'in these data it is the date of the scientific commission\'s decision (2000–2013), not a year of construction. Historical registers record the year of the survey, not of the building. The mainland part of the city — Mestre and Marghera — is not part of the atlas.',
    'Из чего это сделано': 'What it is made of',
    'Данные подготовлены собственным конвейером, а показываются движком':
      'The data are prepared by our own pipeline and shown by the engine of',
    'Амира Мараши (лицензия MIT), который продолжает': 'Amir Marashi (MIT licence), which carries on',
    'LAYRS: Амстердам': 'LAYRS: Amsterdam',
    'Алекса Баракова и': 'Alex Barakov and',
    '«Париж, здание за зданием»': '“Paris, building by building”',
    'Александра Богачёва.': 'Alexander Bogachev.',
    'Некоммерческий проект: данные города, показанные как есть. Атрибуция обязательна для всех источников, перечисленных выше.':
      'A non-commercial project: the city\'s data shown as they are. Attribution is required for every source listed above.',
    'Код и конвейер данных на GitHub': 'Code and data pipeline on GitHub',

    // --- pipeline data: stories, eras, layers ---
    'Сооружения': 'Structures',
    'Мосты': 'Bridges',
    'Мосты, храмы, монастыри': 'Bridges, temples, monasteries',
    '465 мостовых сооружений, нанесённых в OpenStreetMap отдельными площадками: настил показан плитой над каналом. У 375 мостов есть имя — от Понте-деи-Соспири до Понте-делла-Коституцьоне; имена видны на карте и находятся через поиск.':
      '465 bridge structures mapped in OpenStreetMap as areas of their own: each deck is drawn as a slab over the canal. 375 bridges have a name — from the Ponte dei Sospiri to the Ponte della Costituzione; the names show on the map and the search finds them.',
    'В OSM у венецианских мостов нет ни высот, ни дат постройки: высота настила принята за 3 метра, год не указан. Это сооружение, а не здание.':
      'OSM holds neither heights nor building dates for Venetian bridges: the deck height is assumed at 3 metres and no year is given. It is a structure, not a building.',
    'Датировка': 'Dating',
    'Год постройки неизвестен': 'Year of construction unknown',
    'Класс описывает типологию и сохранность, а не дату постройки.':
      'The class describes typology and survival, not a year of construction.',
    'Муниципальная классификация VPRG делит застройку на три эпохи: preottocentesche, ottocentesche, novecentesche — и отдельно помечает перестроенные, слитые и частично изменённые единицы. Это эпоха, а не год.':
      'The city\'s VPRG classification divides the buildings into three eras: preottocentesche, ottocentesche, novecentesche — and marks rebuilt, merged and partly altered units separately. It is an era, not a year.',
    'Форма': 'Shape',
    'Дворы, части и крыши': 'Courtyards, parts and roofs',
    'У части зданий есть внутренние дворы (кольца-отверстия в контуре) и отдельные объёмные части building:part с собственными высотами — ими заданы крыши и надстройки, которые видно с воздуха.':
      'Some buildings have inner courtyards (rings that read as holes in the outline) and separate building:part volumes with heights of their own: they carry the roofs and upper storeys you see from the air.',
    'Части есть только там, где их нанёс OSM; у остальных зданий одна призма.':
      'Parts exist only where OSM mapped them; every other building is a single prism.',
    'Фотографии и статьи': 'Photographs and articles',
    'Связи со зданиями идут по тегу wikidata: от него к статьям Википедии и файлам Викисклада с автором и лицензией. Где тега нет, рядом со зданием ищется статья, и такая связь помечена как предположение.':
      'Links to buildings run through the wikidata tag: from it to Wikipedia articles and Wikimedia Commons files with their author and licence. Where the tag is absent, an article is sought near the building, and that link is marked as a guess.',
    'Ближайшая статья не доказывает, что она описывает это здание.':
      'A nearby article does not prove that it describes this building.',
    'География': 'Geography',
    'Граница острова взята из OpenStreetMap (relation 4817103), исторический центр — муниципалитет Venezia-Murano-Burano (relation 6628638). Слой показывает, какие здания стоят на самом острове, а какие на Джудекке, Сан-Джорджо, Мурано и Бурано.':
      'The island boundary comes from OpenStreetMap (relation 4817103), the historic centre from the municipality of Venezia-Murano-Burano (relation 6628638). The layer shows which buildings stand on the island itself and which on Giudecca, San Giorgio, Murano and Burano.',
    'Остров Венеции и лагуна': 'The island of Venice and the lagoon',
    'Остров и центр — разные области: остров входит в центр, но не наоборот.':
      'Island and centre are different areas: the island lies inside the centre, never the other way round.',
    'вся история города': 'the city\'s whole history',
    'как стоят сегодня': 'as they stand today',
    'по данным OSM': 'from OSM data',
    'до 1800 / XIX / XX век': 'before 1800 / 19th / 20th century',
    'Wikimedia': 'Wikimedia',
    'OpenStreetMap, ODbL 1.0': 'OpenStreetMap, ODbL 1.0',
    'OpenStreetMap, man_made=bridge, ODbL 1.0': 'OpenStreetMap, man_made=bridge, ODbL 1.0',
    'VPRG Città Antica, Comune di Venezia': 'VPRG Città Antica, Comune di Venezia',
    'Wikidata, Wikipedia, Wikimedia Commons': 'Wikidata, Wikipedia, Wikimedia Commons',

    // --- periods, layers, groups ---
    'До 1800 — средневековое ядро и Ренессанс': 'Before 1800 — the medieval core and the Renaissance',
    '1800–1899 — от наполеоновской эпохи до объединения': '1800–1899 — from Napoleon\'s years to unification',
    '1900– — XX век и современность': '1900– — the 20th century and today',
    'До 1800': 'Before 1800',
    'XIX век': '19th century',
    'XX век': '20th century',
    'Остров Венеции': 'The island of Venice',
    'Прочие острова центра': 'Other islands of the centre',
    'Перестроено или слито': 'Rebuilt or merged',
    'Класс отсутствует': 'No class',
    'Есть двор': 'Has a courtyard',
    'Есть объёмные части': 'Has 3D parts',
    'Есть фотография': 'Has a photograph',
    'Есть статья': 'Has an article',
    'Связь предположительная': 'Link is a guess',
    'Объект наследия (тег OSM)': 'Heritage item (OSM tag)',

    // --- building card ---
    'год неизвестен': 'year unknown',
    'мост, год неизвестен': 'bridge, year unknown',
    'Мост': 'Bridge',
    'Здание': 'Building',
    'Здание, {year} г.': 'Building, {year}',
    'Здание, год неизвестен': 'Building, year unknown',
    'Канал, лагуна': 'Canal, lagoon',
    'Район': 'District',
    'Улица, набережная': 'Street, waterfront',
    'Ничего с таким названием на карте нет.': 'Nothing by that name is on the map.',
    '{n} зданий': '{n} buildings',
    'на карте': 'on the map',
    'здание или сооружение': 'building or structure',
    'здания и сооружения': 'buildings and structures',
    'зданий и сооружений': 'buildings and structures',
    'Сегодня, ': 'Today, ',
    'до 1800 года': 'before 1800',
    'неизвестен': 'unknown',
    'эпоха': 'era',
    'оценка': 'estimate',
    'измерено по тегу OSM': 'measured from the OSM tag',
    'по числу этажей OSM': 'from the OSM floor count',
    'принята для моста: в OSM высот нет': 'assumed for the bridge: OSM has no heights',
    'высота ÷ 3 м': 'height ÷ 3 m',
    'OpenStreetMap': 'OpenStreetMap',
    'высота ÷ 3 м.': 'height ÷ 3 m.',
    'Сооружение': 'Structure',
    'настил над каналом, OSM': 'a deck over the canal, OSM',
    'мост с застройкой, OSM': 'a bridge with buildings on it, OSM',
    'Высота': 'Height',
    'Этажи': 'Floors',
    'Архитектор': 'Architect',
    'Архитекторы': 'Architects',
    'Стиль': 'Style',
    'Охрана': 'Protection',
    'Объект наследия': 'Heritage item',
    'Охранная зона': 'Heritage zone',
    'Дата в Wikidata': 'Date in Wikidata',
    'Из Википедии': 'From Wikipedia',
    'Читать далее': 'Read on',
    'Статья в Википедии': 'Wikipedia article',
    'В сюжетах': 'In the stories',
    'Источники': 'Sources',
    'Source': 'Source',
    'Wikipedia': 'Wikipedia',
    'Wikidata': 'Wikidata',
    'Wikimedia Commons': 'Wikimedia Commons',
    'Год указан в {src}.': 'The year is given in {src}.',
    'классификации VPRG': 'the VPRG classification',
    'источника': 'the source',
    'Точного года нет. Муниципальная классификация VPRG относит здание к эпохе «{era}», то есть к интервалу {range}. Формулировка класса записана в таблице свидетельств.':
      'There is no exact year. The city\'s VPRG classification places the building in the era «{era}», that is, in the interval {range}. The wording of the class is recorded in the table of evidence.',
    'Год постройки неизвестен: муниципальной классификации для этого здания нет, и даты в OSM тоже нет. Здание показано серым.':
      'The year of construction is unknown: there is no city classification for this building, and no date in OSM either. The building is drawn grey.',
    'Это мостовое сооружение, а не здание: в OpenStreetMap для венецианских мостов нет ни даты постройки, ни высоты. Настил показан плитой на принятой высоте, год не указан.':
      'This is a bridge structure, not a building: OpenStreetMap holds neither a date nor a height for Venetian bridges. The deck is drawn as a slab at an assumed height, with no year.',

    // --- districts, walks, misc ---
    'All suburbs': 'All districts',
    'Suburb': 'District',
    'Water': 'Water',
    'Street': 'Street',
    'not started': 'not started',
    'Walk again': 'Walk again',
    'Carry on': 'Carry on',
    'Районы города': 'Districts of the city',
    'Маршруты по городу': 'Walks through the city',
    'Фото': 'Photo',
    'зданий': 'buildings',
    'Только {name}': 'Only {name}',
    'измерено по Викиданным': 'measured from Wikidata',
    'Измерена муниципальной съёмкой города 2010 года: у большинства зданий центра карниз измерен относительно собственного основания здания. Где съёмки нет — тег': 'Measured by the city survey of 2010: for most buildings in the centre the eaves height is measured above the building’s own base. Where the survey is silent — the',
    ', иначе по числу этажей, иначе медиана измеренных зданий той же эпохи. Источник высоты написан в карточке. Крыши и надстройки собраны из частей': ', else the number of storeys, else the median of measured buildings of the same epoch. The source of the height is written on the card. Roofs and raised parts come from the',
    'Высоты зданий': 'Building heights',
    'Comune di Venezia, топографический лот 2010 года, слой UN_VOL: объёмные части с измеренными отметками основания, карниза и конька, запись обновлена 31.03.2013. Условия использования архива не установлены.': 'Comune di Venezia, 2010 topographic lot, layer UN_VOL: volumetric parts with measured base, eaves and ridge levels, record updated 31.03.2013. The terms of use of the archive are not established.',
    'измерено съёмкой города 2010 года': 'measured by the city survey of 2010',
    'Год по статье': 'Year from the article',
    'статье итальянской Википедии': 'the Italian Wikipedia article',
    'Годы постройки отдельных зданий': 'Construction years of individual buildings',
    'У части зданий год назван в статье итальянской Википедии. Такой год взят только там, где Викиданные молчат, и показан вместе с фразой, из которой он извлечён. Фраза иногда говорит о части комплекса — о портале, приделе или надстройке, — поэтому относитесь к такому году как к подсказке, а не как к записи реестра.': 'For some buildings the year is stated in the Italian Wikipedia article. Such a year is taken only where Wikidata is silent and is shown together with the sentence it came from. That sentence sometimes speaks of a part of the complex — a portal, a chapel, a raised storey — so read the year as a hint, not as a register entry.',
    'статьи итальянской Википедии, CC BY-SA 4.0: берутся только там, где Викиданные молчат, и только вместе с фразой-свидетельством. Спорные случаи на карту не выводятся.': 'Italian Wikipedia articles, CC BY-SA 4.0: taken only where Wikidata is silent and only together with the sentence that states them. Disputed cases are not drawn on the map.',
    'Охранный статус': 'Heritage status',
    'Охранный статус (Wikidata)': 'Heritage status (Wikidata)',
    'найдена по координатам': 'found by coordinates',
    'Высота в Wikidata': 'Height in Wikidata',
    'Связь': 'Link',
    'Место': 'Place',
    'Слои': 'Layers',
    'Все слои': 'All layers',
    'объектов': 'objects',
    'Места и их истории': 'Places and their stories',
    'Слои карты: выберите слой, чтобы подсветить его объекты и прочитать о них.': 'Layers of the map: choose one to light its objects up and read about them.',
    'All stories': 'All stories',
    'Back to the walk': 'Back to the walk',
    'State Heritage Register': 'State Heritage Register',
  },
};

const OTHER = { it: 'ru', en: 'ru' };   // чего нет на языке — показываем русский исходник

let lang = detect();
const listeners = new Set();

function detect() {
  // В Node словарь просто читается (так его проверяет тест): там нет ни location, ни navigator.
  if (typeof location === 'undefined') return 'ru';
  const fromUrl = new URLSearchParams(location.search).get('lang');
  if (fromUrl && LANGS.includes(fromUrl)) return fromUrl;
  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (saved && LANGS.includes(saved)) return saved;
  } catch (e) { /* приватный режим */ }
  const nav = (typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en').slice(0, 2).toLowerCase();
  return LANGS.includes(nav) ? nav : 'en';
}

// Пробелы и неразрывные пробелы считаются одинаковыми: словарь не должен зависеть от вёрстки.
export const norm = s => String(s).replace(/[\u00a0\u202f\u2009]/g, ' ').replace(/\s+/g, ' ').trim();

export const getLang = () => lang;

import { sourcePresentationText } from './source-presentation.js';

export function t(text, vars) {
  const key = norm(text);
  let out = DICT[lang]?.[key] ?? DICT[OTHER[lang]]?.[key] ?? key;
  if (vars) out = out.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m));
  return sourcePresentationText(out, lang);
}

// Значение может быть строкой, словарём по языкам или уже готовым объектом.
export const pick = v => {
  const selected = v && typeof v === 'object'
    ? (v[lang] ?? v.ru ?? v.en ?? Object.values(v)[0] ?? '') : t(v ?? '');
  return typeof selected === 'string' ? sourcePresentationText(selected, lang) : selected;
};

export function fmtNum(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
}

export function setLang(next) {
  if (!LANGS.includes(next) || next === lang) return;
  lang = next;
  try { localStorage.setItem(STORE_KEY, next); } catch (e) { /* приватный режим */ }
  if (typeof document !== 'undefined') document.documentElement.lang = next;
  applyStatic();
  listeners.forEach(fn => { try { fn(next); } catch (e) { console.error(e); } });
}

export const onLang = fn => { listeners.add(fn); return () => listeners.delete(fn); };

const ATTRS = ['placeholder', 'aria-label', 'title', 'alt', 'content'];
const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'PRE']);
// Исходный русский текст каждого узла и подписи: без него нельзя вернуться к русскому
// и нельзя перейти с итальянского на английский — исходник в разметке уже заменён.
const ORIG_NODE = new WeakMap();
const ORIG_ATTR = new WeakMap();
const known = key => key in DICT.it || key in DICT.en;

// Обход страницы: текстовые узлы и подписи. Посторонние тексты остаются как есть.
export function translateTree(start) {
  if (!start) return start;
  const walk = node => {
    const inAbout = node.nodeType === 1 ? !!node.closest?.('#notes') : !!node.parentElement?.closest?.('#notes');
    for (const child of node.childNodes) {
      if (child.nodeType === 3) {
        if (!ORIG_NODE.has(child)) {
          const raw = child.nodeValue;
          if (norm(raw).length < 2 || !known(norm(raw))) continue;
          ORIG_NODE.set(child, raw);
        }
        const raw = ORIG_NODE.get(child);
        const key = norm(raw);
        const out = lang === 'ru' ? key : (DICT[lang][key] ?? DICT[OTHER[lang]]?.[key] ?? key);
        const lead = raw.match(/^\s*/)[0], tail = raw.match(/\s*$/)[0];
        child.nodeValue = lead + (inAbout ? out : sourcePresentationText(out, lang)) + tail;
      } else if (child.nodeType === 1) {
        if (SKIP.has(child.tagName) || (child.hasAttribute && child.hasAttribute('data-no-i18n'))) continue;
        let store = ORIG_ATTR.get(child);
        for (const a of ATTRS) {
          if (!child.hasAttribute(a)) continue;
          if (!store) { store = {}; ORIG_ATTR.set(child, store); }
          if (!(a in store)) {
            const raw = child.getAttribute(a);
            if (!known(norm(raw))) continue;
            store[a] = raw;
          }
          const key = norm(store[a]);
          child.setAttribute(a, lang === 'ru' ? store[a] : (DICT[lang][key] ?? DICT[OTHER[lang]]?.[key] ?? store[a]));
        }
        walk(child);
      }
    }
  };
  walk(start);
  return start;
}

export function applyStatic(root) {
  if (typeof document === 'undefined') return;
  translateTree(root || document.body);
}

export const DICT_ALL = DICT;

// Язык документа сразу: от него зависит перенос строк и произношение в читалках.
if (typeof document !== 'undefined') document.documentElement.lang = lang;