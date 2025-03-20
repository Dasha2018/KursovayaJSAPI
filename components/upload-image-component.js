import { uploadImage } from "../api.js";
import { renderHeaderComponent } from "./header-component.js";

/**
 * Компонент загрузки изображения.
 * Этот компонент позволяет пользователю загружать изображение и отображать его превью.
 * Если изображение уже загружено, пользователь может заменить его.
 *
 * @param {HTMLElement} params.element - HTML-элемент, Это элемент, в который будет рендериться компонент загрузки изображения.
 * @param {Function} params.onImageUrlChange - Функция, вызываемая при изменении URL изображения.
 *                                            Принимает один аргумент - новый URL изображения или пустую строку.
 */
export function renderUploadImageComponent({ element, onImageUrlChange }) {
  let imageUrl = "";

  const render = () => {
    element.innerHTML = `
      <div class="upload-image">
        ${
          imageUrl
            ? `
            <div class="file-upload-image-container">
              <img class="file-upload-image" src="${imageUrl}" alt="Загруженное изображение">
              <button class="file-upload-remove-button button">Заменить фото</button>
            </div>
            `
            : `
            <label class="file-upload-label secondary-button">
              <input
                type="file"
                class="file-upload-input"
                style="display:none"
              />
              Выберите фото
            </label>
          `
        }
      </div>
    `;
    renderHeaderComponent({
      element: document.querySelector(".header-container"),
    });

    const fileInputElement = element.querySelector(".file-upload-input");
    fileInputElement?.addEventListener("change", () => {
      const file = fileInputElement.files[0];
      if (file) {
        const labelEl = document.querySelector(".file-upload-label");

        // Проверяем тип файла
        const validImageTypes = [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
        ];
        if (!validImageTypes.includes(file.type)) {
          alert("Пожалуйста, выберите изображение (jpg, png, gif, webp)");
          return; // Прерываем выполнение, если файл не соответствует типу
        }

        labelEl.setAttribute("disabled", true);
        labelEl.textContent = "Загружаю файл...";

        uploadImage({ file })
          .then(({ fileUrl }) => {
            imageUrl = fileUrl;
            onImageUrlChange(imageUrl);
            render();
          })
          .catch((error) => {
            labelEl.textContent = "Ошибка при загрузке файла"; // Отображаем сообщение об ошибке
            console.error(error);
          })
          .finally(() => {
            labelEl.removeAttribute("disabled"); // Снимаем блокировку с кнопки
          });
      }
    });

    element
      .querySelector(".file-upload-remove-button")
      ?.addEventListener("click", () => {
        imageUrl = "";
        onImageUrlChange(imageUrl);
        render();
      });
  };

  render();
}
