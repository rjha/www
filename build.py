import os
import markdown
from jinja2 import Environment, FileSystemLoader

def compile_test_page():
    # 1. Target project absolute paths
    md_source = 'notes/sample.md'
    html_output = 'pub/sample.html'
    
    print(f"Reading target file: {md_source}...")
    with open(md_source, 'r', encoding='utf-8') as f:
        raw_markdown = f.read()

    # 2. Configure markdown extensions for technical documentation
    # 'fenced_code' = renders ``` code blocks cleanly
    # 'tables' = processes markdown pipe tables
    html_body = markdown.markdown(raw_markdown, extensions=['fenced_code', 'tables'])

    # 3. Bind template framework
    env = Environment(loader=FileSystemLoader('templates'))
    base_template = env.get_template('static01.html')

    # 4. Mix layout parameters
    rendered_output = base_template.render(
        title="www sample html file",
        content=html_body
    )

    # 5. Flush to static distribution layer
    os.makedirs('pub', exist_ok=True)
    with open(html_output, 'w', encoding='utf-8') as f:
        f.write(rendered_output)
        
    print(f"✔ Success! HTML output built safely at: {html_output}")

if __name__ == '__main__':
    compile_test_page()

