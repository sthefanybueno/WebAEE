import glob
import re

files = glob.glob("tests/integration/*.py")
repl = """from app.infrastructure.security.tokens import create_access_token
import uuid

def auth_headers(papel: str = "coordenacao", user_id: str|None=None, tenant_id: str|None=None) -> dict[str, str]:
    if not user_id:
        user_id = str(uuid.uuid4())
    if not tenant_id:
        tenant_id = str(uuid.uuid4())
    token = create_access_token(user_id, tenant_id, papel, "Test User")
    return {"Authorization": f"Bearer {token}"}
"""

for f in files:
    with open(f, encoding='utf-8') as file:
        content = file.read()
    
    new_content = re.sub(r'from app\.infrastructure\.security\.tokens import create_access_token\nimport uuid\n\ndef auth_headers[\s\S]*?return\s+\{"Authorization":\s*f?"Bearer\s*\{token\}"\}\n', repl, content)
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(new_content)
