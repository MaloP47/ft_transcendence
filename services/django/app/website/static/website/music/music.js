document.addEventListener('DOMContentLoaded', function() {
    var audio = document.getElementById('audio_transcendence');
    var toggleButton = document.getElementById('toggleButton');
    var toggleIcon = document.getElementById('toggleIcon');

    var playAudio = function() {
        audio.play().then(() => {
            toggleIcon.classList.remove('bi-play-fill');
            toggleIcon.classList.add('bi-pause-fill');
            document.removeEventListener('click', playAudio);
            document.removeEventListener('mousemove', playAudio);
            document.removeEventListener('keydown', playAudio);
        }).catch(function(error) {
            console.log('Autoplay was prevented:', error);
        });
    };

    toggleButton.addEventListener('click', function() {
        if (audio.paused) {
            audio.play();
            toggleIcon.classList.remove('bi-play-fill');
            toggleIcon.classList.add('bi-pause-fill');
        } else {
            audio.pause();
            toggleIcon.classList.remove('bi-pause-fill');
            toggleIcon.classList.add('bi-play-fill');
        }
    });
});
