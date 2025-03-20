import { renderUploadImageComponent } from "./upload-image-component.js";

export function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderAddPostPageComponent({ appEl, onAddPostClick }) {
  const render = () => {
    const appHtml = `
      <div class="page-container">
        <div class="header-container">
          <h1 class="add-post">Добавить пост</h1>
        </div>
        <div class="add-post-container">
          <div class="upload-image-container">
            <!-- Компонент загрузки изображения -->
          </div>
          <textarea id="description-input" placeholder="Введите описание..." class="description-input"></textarea>
          <button id="add-button" class="add-post-button">Добавить пост</button>
        </div>
      </div>
    `;

    appEl.innerHTML = appHtml;

    // Инициализируем компонент загрузки изображения
    const uploadImageContainer = appEl.querySelector(".upload-image-container");
    let imageUrl = ""; // По умолчанию пусто

    renderUploadImageComponent({
      element: uploadImageContainer,
      onImageUrlChange(newImageUrl) {
        imageUrl = newImageUrl; // Сохраняем загруженное изображение
      },
    });

    // Обработчик клика по кнопке "Добавить пост"
    document.getElementById("add-button").addEventListener("click", () => {
      const description = document
        .getElementById("description-input")
        .value.trim();

      if (!description) {
        alert("Введите описание для поста.");
        return;
      }

      if (!imageUrl) {
        alert("Пожалуйста, выберите изображение.");
        return;
      }

      // Экранируем описание
      const safeDescription = escapeHtml(description);

      // Передаем данные в функцию-обработчик
      console.log("Добавляем пост:", {
        description: safeDescription,
        imageUrl,
      });
      onAddPostClick({ description: safeDescription, imageUrl });
    });
  };

  render();
}
