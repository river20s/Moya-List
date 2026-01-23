import os
from ticktick.oauth2 import OAuth2
from ticktick.api import TickTickClient

# 환경 변수 로드
client_id = os.getenv('TICKTICK_CLIENT_ID')
client_secret = os.getenv('TICKTICK_CLIENT_SECRET')
username = os.getenv('TICKTICK_USERNAME')
password = os.getenv('TICKTICK_PASSWORD')

# TickTick 로그인
auth_client = OAuth2(client_id=client_id, client_secret=client_secret, redirect_uri="http://localhost")
client = TickTickClient(username, password, auth_client)

# 1. 'Moya List' 찾기 (없으면 Inbox 사용)
project_name = "Moya List"
projects = client.state['projects']
target_project_id = None

for proj in projects:
    if proj['name'] == project_name:
        target_project_id = proj['id']
        break

def sync_issue(title, body, number, url, action):
    task_title = f"[#{number}] {title}"
    task_content = f"{body}\n\n---\nGitHub Issue: {url}"
    
    if action == "opened":
        client.task.create(
            title=task_title,
            content=task_content,
            project_id=target_project_id,
            tags=["GitHub"]
        )
        print(f"성공: 이슈 #{number} 등록 완료")
    
    elif action == "closed":
        tasks = client.state['tasks']
        for task in tasks:
            if task_title in task['title'] and task['status'] == 0:
                client.task.complete(task['id'])
                print(f"성공: 이슈 #{number} 완료 처리")
                break

# 실행 모드 확인 (단일 이슈 처리 vs 전체 동기화)
action_type = os.getenv('ACTION_TYPE')

if action_type == "bulk_sync":
    # 전체 동기화 로직 (이미 열려있는 모든 이슈)
    import requests
    repo = os.getenv('GITHUB_REPOSITORY')
    token = os.getenv('GITHUB_TOKEN')
    
    url = f"https://api.github.com/repos/{repo}/issues?state=open"
    headers = {"Authorization": f"token {token}"}
    response = requests.get(url, headers=headers)
    
    for issue in response.json():
        # Pull Request는 제외하고 Issue만 등록
        if 'pull_request' not in issue:
            sync_issue(issue['title'], issue['body'], issue['number'], issue['html_url'], "opened")
else:
    # 일반적인 트리거 발생 시 (Opened/Closed)
    issue_title = os.getenv('ISSUE_TITLE')
    issue_body = os.getenv('ISSUE_BODY')
    issue_number = os.getenv('ISSUE_NUMBER')
    issue_url = os.getenv('ISSUE_URL')
    sync_issue(issue_title, issue_body, issue_number, issue_url, action_type)