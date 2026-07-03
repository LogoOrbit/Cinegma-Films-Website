// ════════════════════════════════════════════════════════════════
// CINEGMA STUDIO — Content Editors & Modals
// ════════════════════════════════════════════════════════════════

class Editor {
  constructor(title, fields = []) {
    this.title = title;
    this.fields = fields;
    this.data = {};
  }

  render() {
    return `
      <div class="editor-modal-overlay" onclick="closeEditor(event)">
        <div class="editor-modal" onclick="event.stopPropagation()">
          <div class="editor-header">
            <h2>${this.title}</h2>
            <button class="btn-close" onclick="closeEditor()">×</button>
          </div>
          <form class="editor-form" id="editorForm">
            ${this.renderFields()}
            <div class="editor-actions">
              <button type="button" class="btn btn-ghost" onclick="closeEditor()">Cancel</button>
              <button type="submit" class="btn btn-primary">Save</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  renderFields() {
    return this.fields.map(field => {
      const value = this.data[field.name] || field.default || '';

      switch (field.type) {
        case 'text':
        case 'email':
        case 'url':
          return `
            <div class="form-group">
              <label>${field.label}</label>
              <input type="${field.type}" name="${field.name}" value="${escapeHtml(value)}" ${field.required ? 'required' : ''} />
            </div>
          `;
        case 'textarea':
          return `
            <div class="form-group">
              <label>${field.label}</label>
              <textarea name="${field.name}" ${field.required ? 'required' : ''}>${escapeHtml(value)}</textarea>
            </div>
          `;
        case 'select':
          return `
            <div class="form-group">
              <label>${field.label}</label>
              <select name="${field.name}" ${field.required ? 'required' : ''}>
                <option value="">Select ${field.label}</option>
                ${(field.options || []).map(opt => `
                  <option value="${opt.value}" ${opt.value === value ? 'selected' : ''}>${opt.label}</option>
                `).join('')}
              </select>
            </div>
          `;
        case 'checkbox':
          return `
            <div class="form-group">
              <label style="display: flex; align-items: center; gap: 8px; margin-top: 20px;">
                <input type="checkbox" name="${field.name}" ${value ? 'checked' : ''} />
                ${field.label}
              </label>
            </div>
          `;
        default:
          return '';
      }
    }).join('');
  }
}

// ════════════════════════════════════════════════════════════════
// FILM EDITOR
// ════════════════════════════════════════════════════════════════

class FilmEditor extends Editor {
  constructor(data = {}) {
    const fields = [
      { name: 'title', label: 'Film Title', type: 'text', required: true },
      { name: 'slug', label: 'URL Slug', type: 'text', required: true },
      { name: 'description', label: 'Short Description', type: 'textarea' },
      { name: 'plot', label: 'Plot', type: 'textarea' },
      { name: 'genre', label: 'Genre (comma-separated)', type: 'text' },
      { name: 'runtime', label: 'Runtime (seconds)', type: 'text' },
      { name: 'release_date', label: 'Release Date', type: 'date' },
      { name: 'visibility', label: 'Visibility', type: 'select', options: [
        { value: 'public', label: 'Public' },
        { value: 'password_protected', label: 'Password Protected' },
        { value: 'invite_only', label: 'Invite Only' },
        { value: 'private', label: 'Private' },
      ]},
      { name: 'status', label: 'Status', type: 'select', options: [
        { value: 'draft', label: 'Draft' },
        { value: 'scheduled', label: 'Scheduled' },
        { value: 'published', label: 'Published' },
        { value: 'archived', label: 'Archived' },
      ]},
      { name: 'featured', label: 'Featured', type: 'checkbox' },
    ];
    super('Edit Film', fields);
    this.data = data;
  }
}

// ════════════════════════════════════════════════════════════════
// TEAM EDITOR
// ════════════════════════════════════════════════════════════════

class TeamEditor extends Editor {
  constructor(data = {}) {
    const fields = [
      { name: 'name', label: 'Full Name', type: 'text', required: true },
      { name: 'slug', label: 'URL Slug', type: 'text', required: true },
      { name: 'position', label: 'Position/Title', type: 'text' },
      { name: 'bio', label: 'Bio', type: 'textarea' },
      { name: 'skills', label: 'Skills (comma-separated)', type: 'text' },
      { name: 'experience', label: 'Experience', type: 'textarea' },
      { name: 'featured', label: 'Featured', type: 'checkbox' },
    ];
    super('Edit Team Member', fields);
    this.data = data;
  }
}

// ════════════════════════════════════════════════════════════════
// SERVICE EDITOR
// ════════════════════════════════════════════════════════════════

class ServiceEditor extends Editor {
  constructor(data = {}) {
    const fields = [
      { name: 'title', label: 'Service Name', type: 'text', required: true },
      { name: 'slug', label: 'URL Slug', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'categories', label: 'Categories (comma-separated)', type: 'text' },
      { name: 'pricing', label: 'Pricing (optional)', type: 'text' },
      { name: 'featured', label: 'Featured', type: 'checkbox' },
      { name: 'visible', label: 'Visible on Website', type: 'checkbox' },
    ];
    super('Edit Service', fields);
    this.data = data;
  }
}

// ════════════════════════════════════════════════════════════════
// UTILITIES
// ════════════════════════════════════════════════════════════════

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function openEditor(EditorClass, data) {
  const editor = new EditorClass(data);
  const modal = document.createElement('div');
  modal.innerHTML = editor.render();
  modal.id = 'editorContainer';
  document.body.appendChild(modal);

  document.getElementById('editorForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(document.getElementById('editorForm'));
    const data = Object.fromEntries(formData);

    // Handle genre/categories/skills as arrays
    if (data.genre) data.genre = data.genre.split(',').map(s => s.trim());
    if (data.categories) data.categories = data.categories.split(',').map(s => s.trim());
    if (data.skills) data.skills = data.skills.split(',').map(s => s.trim());

    // Handle checkboxes
    data.featured = document.querySelector('input[name="featured"]')?.checked || false;
    if (document.querySelector('input[name="visible"]')) {
      data.visible = document.querySelector('input[name="visible"]')?.checked || false;
    }

    try {
      await onEditorSubmit(data);
    } catch (e) {
      console.error('Editor error:', e);
    }
  });
}

function closeEditor(event) {
  if (event && event.target.id !== 'editorContainer') return;
  const container = document.getElementById('editorContainer');
  if (container) container.remove();
}

// Override in main script
let onEditorSubmit = function(data) {
  console.log('Editor submitted:', data);
};
