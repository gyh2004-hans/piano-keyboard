export function canonicalPrompt(step, allocation) {
  return (step?.targets || []).map(target => {
    const binding = allocation.targets.get(target.note);
    return { target, binding, label: binding?.label || '鼠标' };
  });
}

export function applyPromptClasses(elements, prompt, className) {
  const labels = new Set(prompt.map(item => item.label.toUpperCase()));
  for (const element of elements) {
    element.classList.remove('target', 'target-left', 'matched', 'demo-note');
    const label = element.querySelector('strong')?.textContent.toUpperCase();
    element.classList.toggle(className, labels.has(label));
  }
}
