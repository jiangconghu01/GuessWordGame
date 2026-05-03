/**
 * 输入框组件
 */
export class GuessInput {
  private root: HTMLElement;
  private input: HTMLInputElement;
  private button: HTMLButtonElement;
  private onSubmit?: (value: string) => void;

  constructor(parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.className = 'guess-input';

    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.placeholder = '输入你的猜测...';
    this.input.autocomplete = 'off';
    this.input.spellcheck = false;
    this.input.maxLength = 20;

    this.button = document.createElement('button');
    this.button.textContent = '猜测';
    this.button.type = 'button';

    this.root.append(this.input, this.button);
    parent.appendChild(this.root);

    this.button.addEventListener('click', () => this.submit());
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.submit();
    });
  }

  private submit(): void {
    const value = this.input.value.trim();
    if (value && this.onSubmit) {
      this.onSubmit(value);
      this.input.value = '';
    }
  }

  setOnSubmit(fn: (value: string) => void): void {
    this.onSubmit = fn;
  }

  focus(): void {
    this.input.focus();
  }

  setDisabled(disabled: boolean): void {
    this.input.disabled = disabled;
    this.button.disabled = disabled;
  }

  destroy(): void {
    this.root.remove();
  }
}
