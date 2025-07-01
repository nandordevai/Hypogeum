async function sendNewsletterForm(form) {
    const formData = new FormData(form);
    try {
        await fetch('https://buttondown.com/api/emails/embed-subscribe/nandordevai', {
            method: 'POST',
            body: formData,
        });
    } catch (e) {
        console.error(e);
    }
    document.querySelector('#bd-email').value = '';
}

document.addEventListener('DOMContentLoaded', async () => {
    const form = document.querySelector('#newsletter');
    const submit = document.querySelector('#newsletter-submit');
    if (form && submit) {
        form.addEventListener('submit', async (event) => {
            submit.disabled = true;
            event.preventDefault();
            await sendNewsletterForm(form);
            submit.disabled = false;
        });
    }
});