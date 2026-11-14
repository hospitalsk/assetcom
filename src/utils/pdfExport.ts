import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Exports an HTML element directly to a 1-page A4 PDF file (210mm x 297mm).
 * Ensures crisp resolution, exact alignment, and no page overflows.
 */
export async function exportA4ElementToPdf(
  element: HTMLElement,
  filename: string = 'บันทึกข้อความขออนุมัติซ่อมบำรุงพัสดุ-ครุภัณฑ์.pdf'
): Promise<void> {
  // Capture the element at 2x scale for sharp typography and emblem quality
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.offsetWidth,
    windowHeight: element.offsetHeight,
    onclone: (clonedDoc) => {
      // 1. Replace oklch() color functions in all <style> blocks (Tailwind CSS v4 uses oklch which crashes html2canvas)
      const styleElements = clonedDoc.querySelectorAll('style');
      styleElements.forEach((style) => {
        if (style.textContent && style.textContent.includes('oklch')) {
          style.textContent = style.textContent.replace(/oklch\([^)]+\)/gi, '#000000');
        }
      });

      // 2. Sanitize parsed CSSStyleSheets cssRules in clonedDoc
      try {
        const sheets = Array.from(clonedDoc.styleSheets);
        sheets.forEach((sheet) => {
          try {
            const rules = Array.from(sheet.cssRules || []);
            rules.forEach((rule) => {
              if (rule.cssText && rule.cssText.includes('oklch')) {
                const styleRule = rule as CSSStyleRule;
                if (styleRule.style) {
                  for (let i = 0; i < styleRule.style.length; i++) {
                    const prop = styleRule.style[i];
                    const val = styleRule.style.getPropertyValue(prop);
                    if (val && val.includes('oklch')) {
                      styleRule.style.setProperty(prop, '#000000');
                    }
                  }
                }
              }
            });
          } catch (e) {
            // Ignore cross-origin sheet access
          }
        });
      } catch (e) {
        console.warn('StyleSheet cleanup:', e);
      }

      // 3. Replace inline oklch styles on elements
      const allElements = clonedDoc.querySelectorAll('*');
      allElements.forEach((node) => {
        const el = node as HTMLElement;
        if (el.style && el.style.cssText && el.style.cssText.includes('oklch')) {
          el.style.cssText = el.style.cssText.replace(/oklch\([^)]+\)/gi, '#000000');
        }
      });

      // 4. Transform text inputs to wrapping block/inline spans in cloned document for html2canvas rendering.
      // Text elements NEVER carry border-bottom directly; the separate .memo-field-line element renders the dotted line below.
      const inputs = clonedDoc.querySelectorAll('input[type="text"]');
      inputs.forEach((inputNode) => {
        const input = inputNode as HTMLInputElement;
        const span = clonedDoc.createElement('span');
        span.textContent = input.value || '\u00A0';

        const computed = clonedDoc.defaultView?.getComputedStyle(input);

        if (input.classList.contains('memo-input')) {
          span.className = 'memo-static-text';
          span.style.display = 'block';
          span.style.width = '100%';
          span.style.minHeight = '20px';
          span.style.border = 'none';
          span.style.color = '#000080';
          span.style.fontFamily = "'Sarabun', sans-serif";
          span.style.fontSize = computed?.fontSize || '13px';
          span.style.lineHeight = '1.55';
          span.style.padding = '0';
          span.style.margin = '0';
          span.style.whiteSpace = 'normal';
          span.style.wordBreak = 'break-word';
          span.style.overflowWrap = 'break-word';
          span.style.boxSizing = 'border-box';
          span.style.textAlign = input.style.textAlign || computed?.textAlign || 'left';
        } else {
          span.style.display = 'inline-block';
          span.style.border = 'none';
          span.style.color = '#000080';
          span.style.fontFamily = "'Sarabun', sans-serif";
          span.style.fontSize = computed?.fontSize || '13px';
          span.style.lineHeight = '1.55';
          span.style.minHeight = '20px';
          span.style.padding = '0 4px 2px 4px';
          span.style.margin = '0';
          span.style.verticalAlign = 'bottom';
          span.style.wordBreak = 'break-word';
          span.style.boxSizing = 'border-box';
          span.style.textAlign = input.style.textAlign || computed?.textAlign || 'left';

          if (input.style.width) span.style.width = input.style.width;
          if (input.style.maxWidth) span.style.maxWidth = input.style.maxWidth;
          if (input.style.minWidth) span.style.minWidth = input.style.minWidth;
        }

        input.parentNode?.replaceChild(span, input);
      });
    },
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.98);

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  // Exactly fit onto standard A4: 210mm x 297mm
  pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
  pdf.save(filename);
}
