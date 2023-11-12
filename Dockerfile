FROM sebp/lighttpd:latest

COPY dist/ /var/www/localhost/htdocs
RUN { \
    echo 'server.modules += ( "mod_setenv" )'; \
    echo '$HTTP["url"] =~ "\\.png$" {'; \
    echo '  setenv.add-response-header = ('; \
    echo '    "Access-Control-Allow-Origin" => "*"'; \
    echo '  )'; \
    echo '}'; \
    } >> /etc/lighttpd/lighttpd.conf
RUN chmod -R a+r /var/www/localhost/htdocs

CMD ["start.sh"]

