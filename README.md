# React-Node.js-Distribute 리엑트(React) Node.js 서비스 배포

브라우저에서 Web Server(nginx)를 통해서 요청해서 Web Server는 Static File에서 요청에 대한 응답 가져와 다시 브라우저에 응답한다.

- 가상배포로 PC에 vmware를 통해 리눅스 18.04 LTS를 설치

- 배포환경은 nginx와 PM2를 통한 클라이언트와 서버를 연결한 REST API를 배포

## 0. 잡다

Web Server(nginx)에서 Was(node, java ...)에 Static File(html, css 등등) 파일을 요청하게 하면 Was는 그 외에도 작업을 많이 하기 때문에
Web Server에서 바로 Static File로 요청하게 하고, Was가 필요한 작업일 경우에만 Was에 요청하는 것이 좋다!

### React 개발자가 알면 좋은것

gzip 설정 , 코드 스플리팅 중요!

Server Side rendering 도 익혀두는 것이 좋다.

SSR 장점!

- SEO 최적화
- 초기 로딩 개선
- 서버에서 해야 될 작업들을 브라우저 상에서 미노출 할 수 있다.

## 1. 서버 호스팅

카페 24 일 경우

서버 호스팅 | IDC
&nbsp&nbsp => 퀵 서버 호스팅 ( 가격이 비쌈)
&nbsp&nbsp가상 서버 호스팅 사용 ( 일반형으로 신청 )
&nbsp&nbsp&nbsp&nbsp=> 신청서 작성
&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp=> 서버 구매 ( ubuntu 18.04 )

주인장은 Vmware에 ubuntu 18.04 설치를 했음! ㅎㅎ
즉 위 작업은 패스!

## 2. 배포

이번엔 REST API를 활용해서 서버를 배포한다.

MVC 패턴은 Java에서 주로 사용하는 방식으로 항상 백엔드와 통신한다.
REST API는 프론트(React 등등) 에 먼저 접속하고 필요시에만 필요할 때만 서버에 요청!

※ 참고

1. package.json 에서 build 부분에서 테스트용 build는 그냥 사용하면 되는데
   실제 사용자가 서비스하게 배포할 경우 build:deploy로 따로 작업을 해주는게 보통이다!

`"build:deploy": "NODE_ENV=production react-scripts build"`

`NODE_ENV=production`는 개발 환경일 경우 `localhost:4000` 이런식으로 사용하고
실제 배포할 경우 실제 `backend 서버 주소`를 사용한다.

2. CORS
   사용자가 클라이언트를 타고 서버를 진입할 경우 CORS가 발생한다.

3. main Content
   클라이언트와 서버와 통신할 때 클라이언트는 https가 부착이 되어 있고, 서버는 http일경우,
   main Content라는 에러가 발생하며 서로 소통이 안될 수 있다.

4. proxy
   2번과 3번의 문제를 해결하기 위해서 사용되는 것으로 통신할 경우 해당 클라이언트만 통신이 되게끔 해준다.
   쉽게 말해 클라이언트와 서버가 통신이 될 수 있게 해준다.

   이 proxy를 설정하는 방법은 package.json 파일에 직접 넣을 수 있고, 따로 proxy 파일을 만들 수 있다.

   파일로 만들 경우 setupProxy.js 라는 파일을 만들고

   const { createProxyMiddleware } = require("http-proxy-middleware");

   ```
   module.exports = function (app) {
   app.use(
       createProxyMiddleware("/api", {
       target: "http://localhost:5000/",
       changeOrigin: true,
       })
   );
   };
   ```

   이것은 통신을 /api로 할 경우 localhost:5000 번으로 보낸다는 뜻이다.
   여기서 NODE_ENV=production 관련 조건식을 사용해서 실제 배포 주소 등으로 적어 줄 수 있다.

## 3. 서버 설정

1. git을 설치한다.

   [깃 설치 ] sudo apt-get install git

2. nginx 설치

   [nginx 설치] sudo apt install nginx

   nginx는 설치시 etc 아래 nginx가 있다.
   그후 백업을 한다.

   [백업1] sudo cp -r /etc/nginx/sites-available/ /etc/nginx/sites-available-origin
   
   [백업2] sudo cp -r /etc/nginx/sites-enabled/ /etc/nginx/sites-enabled-origin
   
   [기존 내용 삭제] sudo rm /etc/nginx/sites-available/default
   
   [기존 내용 삭제2] sudo rm /etc/nginx/sites-enabled/default
   
   [sites-available 내 설정 파일 생성 1] cd /etc/nginx/sites-available
   
   [sites-available 내 설정 파일 생성 2] sudo touch myapp.conf
   

   그후 [생성파일 편집] vim myapp.conf

   안에

   ```
   server {
      listen 80;
      location / {
         root   /home/test/build;
         index  index.html index.htm;
         try_files $uri /index.html;
      }

      location /api {
         proxy_pass http://localhost:5000/;
      }
   }
   ```

   esc -> : wq
   중요! try_files 설정은 일종의 nginx 자체의 라우팅 설정이다. 보통 이 부분에서 특정 패턴의 url에 특정 파일등을 redirect하는 설정을 한다. 만약 페이지를 못 찾을 경우 404 not found 설정도 이곳에서 한다.
   하지만 react 프로젝트인 경우, 웹서버에서 먼저 리퀘스트 url을 가로채면 react-router의 기능을 사용할 수 없게 된다. 따라서 위처럼 모든 request를 index.html로 곧장 가게 설정 해줘야 한다.
   [심볼릭] sudo ln -s /etc/nginx/sites-available/myapp.conf /etc/nginx/sites-enabled/myapp.conf
   [nginx 재시작] sudo systemctl stop nginx
   [nginx 재시작] sudo systemctl start nginx

   cd /home 으로 이동 후 mkdir test 로 폴더를 만든 후 cd test/ 그 안에 mkdir build 로 build 폴더를 만든 후 cd build
   안에 touch index.html 로 안에 파일을 만들어 준다.

   그후
   git clone https://github.com/riosee2415/deploy-test
   준비된 클라이언트 코드를 git을 통해 받아온다.

   sudo apt-get update
   sudo apt-get install build-essential libssl-dev

   sudo apt-get install nodejs <- 아래 NVM이 안될 경우 ㅎㅎ;;

   -------- NODE 버전 관리를 위해 사용 & 필요한 노드 버전 설치 --------
   sudo apt-get install -y curl
   sudo curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.0/install.sh | bash
   export NVM_DIR="$HOME/.nvm"
   [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
   [ -s "$NVM_DIR/bash_completion" ] && . "\$NVM_DIR/bash_completion"
   nvm ls-remote

   nvm install 12.18.3

   설치가 완료되면 node -b, npm -v를 하여 제대로 설치가 되었는지 확인한다.

   그후 deploy-test로 이동 후 npm install을 해준다.

   완료 후 pwd로 경로를 확인한다.

   cd /etc/nginx/sites-available 안에
   vim myapp.conf 에서

   ```
      server {
      listen 80;
      location / {
         root   /home/deploy-test/build;  <- 이렇게 경로 후 /build 로 벼녁ㅇ한다.
         index  index.html index.htm;
         try_files $uri /index.html;
      }

      location /api {
         proxy_pass http://localhost:5000/;
      }
   }
   ```

   그후 다시 cd /home/deploy-test 로 이동 후 npm run build를 해준다.

   완료 되면
   [nginx 재시작] sudo systemctl stop nginx
   [nginx 재시작] sudo systemctl start nginx
   을 해준다.

   cd .. 으로 상위 폴더로 가서 다시 git 으로 이번엔 서버를 받아온다.
   git clone https://github.com/riosee2415/deploy-server

   완료 하면 npm install -g pm2 설치 <- pm2 ? node server를 꺼지지 않고 모니터링 할 수 있게끔 관리할 수 있다.

   설치 후 pm2 start npm -- start <- 실행을 시켜주고 이렇게 실행하면 끄기 전까지 꺼지지 않는다.
   pm2 restart 0 --name "deploy[5000]" 을 사용하면 "" 안 이름으로 실행한다.

   pm2 monit를 입력하면 모니터링이 가능하다.

   완료!
