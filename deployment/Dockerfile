FROM sebp/lighttpd:latest

RUN { \
    echo 'server.modules += ( "mod_setenv" )'; \
    echo '$HTTP["url"] =~ "\\.png$" {'; \
    echo '  setenv.add-response-header = ('; \
    echo '    "Access-Control-Allow-Origin" => "*"'; \
    echo '  )'; \
    echo '}'; \
    } >> /etc/lighttpd/lighttpd.conf

COPY --chmod=a+r dist/ /var/www/localhost/htdocs

CMD ["start.sh"]
