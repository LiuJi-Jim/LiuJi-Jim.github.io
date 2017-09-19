(function() {
    function $(id) {
        return document.getElementById(id)
    }
    var cvs = $('cvs')
    var btn = $('btn')
    var input = $('input')
    var preview = $('preview')
    var ctx = cvs.getContext('2d')
    var defaultText = '社、社会'

    var template = document.createElement('img')
    template.onload = function() {
        drawText(defaultText)
    }

    function drawTemplate() {
        ctx.drawImage(template, 0, 0)
    }

    function drawText(txt) {
        drawTemplate()
        ctx.font = 'bold 32px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillStyle = '#000'
        ctx.fillText(txt, cvs.width / 2, cvs.height - 10)

        preview.src = cvs.toDataURL('image/png')
    }
    
    template.src = './shehui.jpg' // run
    input.value = defaultText

    btn.addEventListener('click', function(e) {
        e.preventDefault()
        var value = input.value
        if (value) {
            drawText(value)
        }
    }, false)
})()
