 module.exports = {
  entry: "./index.js", // Входной файл, где пишем свой код
  output: {
    filename: "main.js", // Выходной файл, который подключаем к HTML
    // Сохранится он по пути "./dist/main.js"
  },
  optimization: {
    minimize: true, // Включает минификацию
  },
};
 

