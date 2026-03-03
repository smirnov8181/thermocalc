export const MATERIALS = {
  "Утеплители": [
    { name: "Минеральная вата", lambda: 0.045, mu: 0.3, color: "#FFE082", density: 100 },
    { name: "Пенополистирол ПСБ-25", lambda: 0.039, mu: 0.05, color: "#E0F7FA", density: 25 },
    { name: "ЭППС (экструзионный)", lambda: 0.032, mu: 0.005, color: "#B2EBF2", density: 35 },
    { name: "Пенополиуретан", lambda: 0.028, mu: 0.05, color: "#FFF9C4", density: 40 },
    { name: "Эковата", lambda: 0.04, mu: 0.3, color: "#DCEDC8", density: 65 },
    { name: "Базальтовая плита", lambda: 0.036, mu: 0.3, color: "#F0E68C", density: 80 },
  ],
  "Каменная кладка": [
    { name: "Кирпич керамический полнотелый", lambda: 0.56, mu: 0.11, color: "#D4786B", density: 1800 },
    { name: "Кирпич керамический пустотелый", lambda: 0.44, mu: 0.14, color: "#E8A090", density: 1400 },
    { name: "Кирпич силикатный", lambda: 0.76, mu: 0.11, color: "#E0D8CC", density: 1800 },
    { name: "Газобетон D400", lambda: 0.11, mu: 0.23, color: "#F5F0E8", density: 400 },
    { name: "Газобетон D500", lambda: 0.14, mu: 0.2, color: "#EDE8DE", density: 500 },
    { name: "Газобетон D600", lambda: 0.18, mu: 0.17, color: "#E5DFD4", density: 600 },
    { name: "Керамзитобетон D800", lambda: 0.31, mu: 0.14, color: "#C8B8A0", density: 800 },
    { name: "Пеноблок D600", lambda: 0.16, mu: 0.2, color: "#F0EBE0", density: 600 },
  ],
  "Отделка": [
    { name: "Штукатурка цементная", lambda: 0.76, mu: 0.09, color: "#BDBDBD", density: 1800 },
    { name: "Штукатурка гипсовая", lambda: 0.35, mu: 0.11, color: "#F5F0E8", density: 1200 },
    { name: "Гипсокартон ГКЛ", lambda: 0.21, mu: 0.075, color: "#F5F5F5", density: 850 },
    { name: "Фанера", lambda: 0.15, mu: 0.02, color: "#D7C9A8", density: 600 },
    { name: "Вагонка сосна", lambda: 0.15, mu: 0.06, color: "#DEC89C", density: 500 },
    { name: "Сайдинг ПВХ", lambda: 0.16, mu: 0.02, color: "#E8E8E8", density: 1300 },
  ],
  "Прочее": [
    { name: "Бетон", lambda: 1.51, mu: 0.03, color: "#9E9E9E", density: 2400 },
    { name: "Дерево (сосна поперёк)", lambda: 0.18, mu: 0.06, color: "#C9A86C", density: 500 },
    { name: "Пароизоляция", lambda: 0.17, mu: 0.0002, color: "#CFD8DC", density: 100 },
    { name: "Ветрозащита", lambda: 0.17, mu: 0.4, color: "#B0BEC5", density: 100 },
  ]
};

export const DEFAULT_LAYERS = [
  { id: 1, material: MATERIALS["Отделка"][2], thickness: 12.5 },
  { id: 2, material: MATERIALS["Каменная кладка"][3], thickness: 375 },
  { id: 3, material: MATERIALS["Утеплители"][0], thickness: 100 },
  { id: 4, material: MATERIALS["Отделка"][0], thickness: 20 },
];
