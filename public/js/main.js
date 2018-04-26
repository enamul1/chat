
$(document).ready(function(){
    const socket = io();
    $('#join-chat').click(function () {
        var username = $.trim($('#username').val());
        $.ajax({
            url: '/login',
            type: 'POST',
            data: {
                username: username
            },
            success: function (response) {
                if (response.status == 'OK') {
                    socket.emit('login', username);
                    $('.chat').show();
                    $('#leave-chat').data('username', username);
                    $('#send-message').data('username', username);

                    let s = $("<select id='yearDropdown' name='dropdown' >");
                    $('<option />', {value: 0, text: 'Select a user'}).appendTo(s);
                    response.users.forEach(function(user) {
                        $('<option />', {value: user.email, text: user.user_name}).appendTo(s);
                    });
                    $("</select>").appendTo(s);
                    $('.users').html(s);
                    $("input[name=currentUser]").val(username);
                    $('.join-chat').hide();
                } else if (response.status == 'FAILED') {
                    alert("Sorry but the username already exists, please choose another one");
                    $('#username').val('').focus();
                }
            }
        });
    });

    $('#search').click(function(){
        let user1 = $("select[name=dropdown]").val();
        let user2 = $("input[name=currentUser]").val();
        $('.message-form').show();
        $.get('/messages?user1='+user1+'&user2='+user2, function (response) {
            if (response.length > 0) {
                var message_count = response.length;
                var html = '';
                for (var x = 0; x < message_count; x++) {
                    html += "<div class='msg'><div class='user'>" + response[x]['from'] + "</div><div class='txt'>" + response[x]['message'] + "</div></div>";
                }
                $('.messages').html(html);
            }
        });
    });

    $('#send-message').click(function () {
        var fromEmail = $(this).data('username');
        var message = $.trim($('#message').val());
        let toEmail = $("select[name=dropdown]").val();
        $.ajax({
            url: '/messages',
            type: 'POST',
            dataType: 'json',
            data: {
                'to': toEmail,
                'message': message,
                'from':fromEmail
            },
            success: function (response) {
                if (response.status == 'OK') {
                    socket.emit('message', {
                        fromEmail,
                        message,
                        toEmail,
                    });
                    $('#message').val('');
                }
            }
        });
    });

    socket.on('send', function (data){
        var html = "<div class='msg'><div class='user'>" + data.fromEmail + "</div><div class='txt'>" + data.message + "</div></div>";
        $('.messages').append(html);
    });

});
