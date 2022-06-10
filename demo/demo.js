import '@polymer/iron-demo-helpers/demo-pages-shared-styles';
import '@polymer/iron-demo-helpers/demo-snippet';
import '@polymer/iron-icon';
import '@vaadin/button';
import '@vaadin/text-field';
import '@vaadin/select';
import '@vaadin/vaadin-lumo-styles/icons';
import '@vaadin/vaadin-lumo-styles/typography';
import '@vaadin-component-factory/vcf-anchor-nav';
import '../src/vcf-svg';
import './demo-icons';

window.addEventListener('WebComponentsReady', () => {
  const mainCodeContainerStyles = document.querySelector('#codeContainerStyles');
  document.querySelector('body').removeAttribute('loading');
  document.querySelectorAll('.hidden').forEach(element => element.classList.remove('hidden'));
  document.querySelectorAll('demo-snippet').forEach(element => {
    const codeContainer = element.shadowRoot.querySelector('.code-container');
    const codeContainerStyles = document.createElement('style');
    const copyButton = codeContainer.querySelector('#copyButton');
    const copyVaadinButton = document.createElement('vaadin-button');
    const copyIcon = document.createElement('iron-icon');
    const markedElement = codeContainer.querySelector('marked-element');
    // Copy <vaadin-button>
    copyVaadinButton.id = 'copyVaadinButton';
    copyVaadinButton.setAttribute('theme', 'icon');
    copyVaadinButton.setAttribute('title', 'Copy to clipboard');
    copyVaadinButton.appendChild(copyIcon);
    copyVaadinButton.addEventListener('click', () => {
      document
        .querySelectorAll('demo-snippet')
        .forEach(element => element.shadowRoot.querySelector('iron-icon').setAttribute('icon', 'vcf-demo:copy'));
      copyButton.click();
      copyIcon.setAttribute('icon', 'lumo:checkmark');
    });
    copyIcon.setAttribute('icon', 'vcf-demo:copy');
    element.shadowRoot.appendChild(codeContainerStyles);
    codeContainerStyles.innerHTML = mainCodeContainerStyles.innerHTML;
    codeContainer.insertBefore(copyVaadinButton, markedElement);
  });
});
