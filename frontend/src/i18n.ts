import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  ru: {
    translation: {
      nav: {
        home: 'Главная',
        jobs: 'Работа',
        pay: 'Оплата',
        transport: 'Транспорт',
        profile: 'Профиль'
      },
      profile: {
        edit: 'Редактировать',
        settings: 'Настройки',
        security: 'Безопасность',
        appSecurity: 'Защита приложения',
        passcodeBiometrics: 'Код-пароль и биометрия',
        passcodeOnLogin: 'Код-пароль при входе',
        turnOff: 'Отключить',
        setup: 'Установить',
        faceId: 'Face ID / Touch ID',
        theme: 'Тема оформления',
        lightTheme: 'Светлая тема',
        darkTheme: 'Темная тема',
        language: 'Язык',
        logout: 'Выйти из аккаунта',
        save: 'Сохранить',
        cancel: 'Отмена',
        activeSessions: 'Активные сессии',
        currentDevice: 'Текущее устройство',
        loginHistory: 'История входов',
        loading: 'Загрузка профиля...',
        unauthorized: 'Вы не авторизованы',
        login_required: 'Пожалуйста, войдите в аккаунт через верхнее меню, чтобы получить доступ к Личному Кабинету.',
        user: 'Пользователь',
        documents: 'Мои Документы',
        payments: 'Платежи',
        history: 'История'
      },
      lock: {
        enterPin: 'Введите код-пароль',
        locked: 'LifeKG заблокирован'
      },
      home: {
        services: 'Государственные услуги',
        medicine: 'Медицина',
        education: 'Образование',
        tourism: 'Туризм',
        market: 'Маркетплейс',
        ai: 'AI Помощник',
        goodMorning: 'Доброе утро',
        goodAfternoon: 'Добрый день',
        goodEvening: 'Добрый вечер',
        goodNight: 'Доброй ночи',
        weather: 'Погода',
        currency: 'Курс НБ КР',
        buy: 'Покупка',
        sell: 'Продажа',
        myCard: 'Моя Карта',
        balance: 'Баланс',
        transfer: 'Перевод',
        topup: 'Пополнить',
        allServices: 'Все сервисы',
        bishkek: 'Бишкек',
        search: 'Поиск услуг и новостей...',
        notifications: 'Уведомления',
        noNotifications: 'Нет новых уведомлений',
        exchangeRates: 'Курсы Валют',
        close: 'Закрыть',
        currencyList: {
          USD: 'Доллар США',
          EUR: 'Евро',
          RUB: 'Российский рубль',
          KZT: 'Казахский тенге'
        }
      },
      qr: {
        title: 'Оплата по QR',
        back: 'Назад',
        pointCamera: 'Наведите камеру на QR-код',
        processing: 'Обработка платежа...',
        bankConnection: 'Связываемся с банком',
        success: 'Успешно оплачено',
        purpose: 'Назначение',
        code: 'Код',
        done: 'Готово'
      }
    }
  },
  kg: {
    translation: {
      nav: {
        home: 'Башкы бет',
        jobs: 'Жумуш',
        pay: 'Төлөм',
        transport: 'Транспорт',
        profile: 'Профиль'
      },
      profile: {
        edit: 'Оңдоо',
        settings: 'Жөндөөлөр',
        security: 'Коопсуздук',
        appSecurity: 'Тиркемени коргоо',
        passcodeBiometrics: 'Код-пароль жана биометрия',
        passcodeOnLogin: 'Кирүүдөгү код-пароль',
        turnOff: 'Өчүрүү',
        setup: 'Орнотуу',
        faceId: 'Face ID / Touch ID',
        theme: 'Дизайн темасы',
        lightTheme: 'Жарык тема',
        darkTheme: 'Караңгы тема',
        language: 'Тил',
        logout: 'Аккаунттан чыгуу',
        save: 'Сактоо',
        cancel: 'Жокко чыгаруу',
        activeSessions: 'Активдүү сессиялар',
        currentDevice: 'Учурдагы түзмөк',
        loginHistory: 'Кирүү тарыхы',
        loading: 'Профиль жүктөлүүдө...',
        unauthorized: 'Сиз авторизациядан өткөн жоксуз',
        login_required: 'Жеке кабинетке кирүү үчүн жогорку меню аркылуу кириңиз.',
        user: 'Колдонуучу',
        documents: 'Менин Документтерим',
        payments: 'Төлөмдөр',
        history: 'Тарых'
      },
      lock: {
        enterPin: 'Код-паролду киргизиңиз',
        locked: 'LifeKG блоктолгон'
      },
      home: {
        services: 'Мамлекеттик кызматтар',
        medicine: 'Медицина',
        education: 'Билим берүү',
        tourism: 'Туризм',
        market: 'Маркетплейс',
        ai: 'AI Жардамчы',
        goodMorning: 'Кутман таң',
        goodAfternoon: 'Кутман күн',
        goodEvening: 'Кутман кеч',
        goodNight: 'Бейпил түн',
        weather: 'Аба ырайы',
        currency: 'УБ курсу',
        buy: 'Алуу',
        sell: 'Сатуу',
        myCard: 'Менин Картам',
        balance: 'Баланс',
        transfer: 'Которуу',
        topup: 'Толуктоо',
        allServices: 'Бардык кызматтар',
        bishkek: 'Бишкек',
        search: 'Кызматтарды жана жаңылыктарды издөө...',
        notifications: 'Билдирүүлөр',
        noNotifications: 'Жаңы билдирүүлөр жок',
        exchangeRates: 'Валюта курстары',
        close: 'Жабуу',
        currencyList: {
          USD: 'АКШ доллары',
          EUR: 'Евро',
          RUB: 'Орус рубли',
          KZT: 'Казак теңгеси'
        }
      },
      qr: {
        title: 'QR боюнча төлөө',
        back: 'Артка',
        pointCamera: 'Камераны QR-кодко буруңуз',
        processing: 'Төлөмдү иштетүү...',
        bankConnection: 'Банк менен байланышууда',
        success: 'Ийгиликтүү төлөндү',
        purpose: 'Дайындоо',
        code: 'Код',
        done: 'Даяр'
      }
    }
  }
};

const savedLang = localStorage.getItem('lang') || 'ru';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang,
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false // React already escapes values
    }
  });

export default i18n;
