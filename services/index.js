/**
 * Slantapp code and properties {www.slantapp.io}
 */
const LOG_DEBUG = true
const emailTemple = require("./services.email");

//send parent welcome email
exports.sendParentWelcomeEmail = (data) => {
    new emailTemple(data.email).who(data.firstName)
        .body("Dear " + data.firstName + "<br/>" +
            "<strong>We're thrilled to have you join our community.</strong><br/>" +
            "<p>At RYD Learning, we're all about empowering young minds with computer skills and guiding them to become coding wizards. Get ready for an exciting journey filled with fun activities, engaging lessons, and lots of coding adventures for your child</p><br/>" +
            "<p>Here's what you can look forward to:</p><br/>" +
            "<strong>Fun Learning:</strong> Interactive lessons and activities designed to make learning computer skills enjoyable and exciting.<br/>" +
            "<strong>Coding Exploration:</strong> Discover the fascinating world of coding as your child unlock new skills and unleash your creativity through programming projects.<br/>" +
            "<strong>Supportive Community:</strong> Connect with other young learners, share ideas, and collaborate on projects in our supportive and encouraging community.<br/>" +
            "<p>Ready to get started? Head over to your account and register for a program</p><br/>" +
            "<i>If you ever have any questions or need assistance, don't hesitate to reach out. Our contact details are available on our website. We're here to help you every step of the way!</i><br/>" +
            "<p>Happy Learning!</p>")
        .subject("Welcome to RYD Learning").send().then(r => LOG_DEBUG ? console.log(r) : null);
}

//send teacher welcome email
exports.sendTeacherWelcomeEmail = (data) => {
    new emailTemple(data.email).who(data.firstName)
        .body("Dear " + data.firstName + "<br/>" +
            "<strong>We're thrilled to have you join our community.</strong><br/>" +
            "<p>At RYD Learning, we're all about empowering young minds with computer skills and guiding them to become coding wizards. Get ready for an exciting journey filled with fun activities, engaging lessons, and lots of coding adventures for your child</p><br/>" +
            "<p>Here's what you can look forward to:</p><br/>" +
            "<strong>Fun Learning:</strong> Interactive lessons and activities designed to make learning computer skills enjoyable and exciting.<br/>" +
            "<strong>Coding Exploration:</strong> Discover the fascinating world of coding as your child unlock new skills and unleash your creativity through programming projects.<br/>" +
            "<strong>Supportive Community:</strong> Connect with other young learners, share ideas, and collaborate on projects in our supportive and encouraging community.<br/>" +
            "<p>Ready to get started? Head over to your account and register for a program</p><br/>" +
            "<i>If you ever have any questions or need assistance, don't hesitate to reach out. Our contact details are available on our website. We're here to help you every step of the way!</i><br/>" +
            "<p>Happy Learning!</p>")
        .subject("Welcome to RYD Learning").send().then(r => LOG_DEBUG ? console.log(r) : null);
}

//send email password reset
exports.sendPasswordReset = (email, newPassword) => {
    new emailTemple(email).subject("Password Reset - RYD Learning").body("Your new RYD Learning Password is " + `<strong><code>${newPassword}</code></strong>`).send().then(r => LOG_DEBUG ? console.log(r) : null)
}

//send email password reset
exports.sendPasswordNotifications = (email) => {
    new emailTemple(email).subject("Password Updated - RYD Learning").body("Your RYD Leaning Password has been changed ").send().then(r => LOG_DEBUG ? console.log(r) : null)
}

//send notifications on account events
exports.sendNotificationUpdate = (email, msg) => {
    new emailTemple(email).subject("Profile Update - RYD Learning").body("Your account has been updated. <br/>Actions: <code>" + msg + "</code>").send().then(r => LOG_DEBUG ? console.log(r) : null)
}

//send notifications on new child events
exports.sendNotificationNewChild = (email, data) => {
    new emailTemple(email).subject("Child Added - RYD Learning").body(`You have successfully added ${data.firstName} to your profile`).send().then(r => LOG_DEBUG ? console.log(r) : null)
}

//send notifications on new child events
exports.sendNotificationRemoveChild = (email, data) => {
    new emailTemple(email).subject("Child Removed - RYD Learning").body(`You have successfully removed ${data.firstName} from your profile`).send().then(r => LOG_DEBUG ? console.log(r) : null)
}

//send email password reset
exports.sendOTP = (email, otp) => {
    new emailTemple(email).subject("OTP - RYD Learning").body("Your RYD Learning OTP is " + `<strong><code>${otp}</code></strong>`).send().then(r => LOG_DEBUG ? console.log(r) : null)
}

//send program update to parent
exports.sendParentNewProgram = (email, data) => {
    new emailTemple(email).subject("New Program - RYD Learning").body(`You added a new program to your child ${data.child.firstName}. ${data._package.title} - ${data.program.level}`).send().then(r => LOG_DEBUG ? console.log(r) : null)
}

//send program update to parent
exports.sendPromoParentNewProgram = (email, child) => {
    new emailTemple(email).subject("New Program - RYD Learning").body(`You added a new program to your child ${child.firstName}.`).send().then(r => LOG_DEBUG ? console.log(r) : null)
}

//send new admin email
exports.sendAdminNewEmail = (email) => {
    new emailTemple(email).subject("New Admin - RYD Learning").body(``).send().then(r => LOG_DEBUG ? console.log(r) : null)
}

//send teacher invite email
exports.sendTeacherInviteEmail = (data) => {
    new emailTemple(data.email).who(data.email)
        .body("Dear Educator" + "<br/>" +
            "<p>Unlock a world of educational opportunities on RYD Learning. Our user-friendly interface and diverse range of resources are designed to support your teaching journey.</p><br/>" +
            "<strong>To start exploring, click the link below to register:</strong> <br/> <br/>" +
            `<a href='https://teacher.rydlearning.com/teacher/sign-up'>Register Here</a><br/> <br/>` +
            "<p>Ready to get started? Head over to your account and register for a program</p><br/>" +
            "<i>If you ever have any questions or need assistance, don't hesitate to reach out. Our contact details are available on our website. We're here to help you every step of the way!</i><br/>" +
            "<p>Happy Learning!</p>")
        .subject("Invitation to Join RYD Learning").send().then(r => LOG_DEBUG ? console.log(r) : null);
}

//send email to parent
exports.sendParentEmail = (email, body, subject = "", attachUrl = null) => {
    new emailTemple(email).subject(`${subject || "Mail"} - RYD Learning`).setAttachmentLink(attachUrl).body(body).send().then(r => LOG_DEBUG ? console.log(r) : null)
}

//send new admin email
exports.sendSubscriptionPaymentEmail = (email, data) => {
    new emailTemple(email).body(`
    <strong>Dear ${data.firstName}</strong>.
    <br/>
    <p>
    Congratulations! You are now successfully subscribed to RYD Learning Program Package! We're thrilled to have you on board and excited to embark on this learning journey together.
    <br/>
    <small>To get started, simply log in to your account using the credentials you provided during registration. From there, you can explore our extensive library of courses and begin your learning journey whenever and wherever it's convenient for you.</small>
    <br/>
    <small>If you have any questions, concerns, or feedback along the way, please don't hesitate to reach out to our dedicated support team. We're here to assist you and ensure that your experience with RYD Learning is nothing short of exceptional.</small>
    <br/>
    <p>Once again, welcome aboard! We're thrilled to have you as part of our learning community and look forward to helping you achieve your goals.</p>
    </p>
`).subject("Subscription - RYD Learning").send().then(r => LOG_DEBUG ? console.log(r) : null);
}


exports.sendParentCertificateEmail = (data) => {
    new emailTemple(data.email).who("Parent")
        .body("Dear " + data.name + "<br/><br/>" +
            "<strong>Congratulations! " + data.child + " successfully completed "+data.level+" of their coding class at RYD learning.</strong><br/><br/>" +
            "<p>We are excited to let you know that your child's certificate is now ready for download!</p><br/>" +
            "<strong>To download the certificate, please follow these simple steps:</strong><br/>" +
            "<p>* Please <a href='https://parent.rydlearning.com/parent/certificate/preview/"+data.id+"'>Click here</a> to download your certificate.</p><br/> <br/>" +
            "<p>The certificate will be available for download in PDF format.</p><br/><br/>" +
            "<i>If you encounter any issues or need assistance with downloading the certificate, feel free to reach out to our support team at learning@rydlearning.com or call +18337371275.</i><br/><br/>" +
            "<strong>Thank you for allowing us to be part of your child's learning journey!</strong><br/>")
        .subject("Your Child's Coding Class Certificate is Ready to Download").send().then(r => LOG_DEBUG ? console.log(r) : null);
}

////////////////////////////////////////////////////////////////
// PARTNER
////////////////////////////////////////////////////////////////

// PARTNER WELCOME MESSAGE
exports.sendPartnerWelcomeEmail = (data) => {
    new emailTemple(data.email).who(data.firstName)
        .body("Dear " + data.firstName + "<br/>" +
            "<strong>We're thrilled to welcome you to the RYD Learning Partner Community!</strong><br/>" +
            "<p>As a partner, you'll be at the forefront of inspiring young minds and empowering them with the essential computer skills they need to succeed in the digital age.</p><br/>" +
            "<p>Together, we'll create a vibrant learning environment where children can explore their passion for coding, develop problem-solving skills, and build a strong foundation for their future careers.<br/>" +
            "<p>Here's what you can expect as a RYD Learning Partner: </p><br/>" +
            "<strong>Exclusive access to our comprehensive curriculum:</strong> Our carefully crafted lessons and activities are designed to engage and inspire young learners.<br/>" +
            "<strong>A supportive community of educators:</strong> Connect with like-minded professionals and share best practices.<br/>" +
            "<strong>Robust tools and resources:</strong> Utilize our platform to manage your programs, track student progress, and communicate with parents.<br/>" +
            "<strong>We'll review your partner application and notify you once your account is approved.</strong><br/>" +
            "<p>We're excited to see how you'll make a difference in the lives of your students.</p><br/>" +
            "<i>If you ever have any questions or need assistance, don't hesitate to reach out. Our contact details are available on our website. We're here to help you every step of the way!</i><br/>" +
            "<p>Happy Learning!</p>")
        .subject("Welcome to RYD Learning Partner").send().then(r => LOG_DEBUG ? console.log(r) : null);
}

// PARTNER APPROVED MESSAGE
exports.sendPartnerApprovedEmail = (data) => {
    new emailTemple(data.email).who(data.firstName)
        .body("Dear " + data.firstName + "<br/>" +
            "<strong>We're excited to inform you that your RYD Learning Partner account has been approved!</strong><br/>" +
            "<p>You can now invite parent and start managing your own coding programs.</p><br/>" +
            "<p>Here's what you can expect as a RYD Learning Partner: </p><br/>" +
            "<strong>Exclusive access to our comprehensive curriculum:</strong> Our carefully crafted lessons and activities are designed to engage and inspire young learners.<br/>" +
            "<strong>A supportive community of educators:</strong> Connect with like-minded professionals and share best practices.<br/>" +
            "<strong>Robust tools and resources:</strong> Utilize our platform to manage your programs, track student progress, and communicate with parents.<br/>" +
            "<strong>We're eager to see how you'll inspire and empower young minds through coding.</strong><br/>" +
            "<p>To get started, log in to your partner dashboard and invite parents. </p><br/>" +
            "<i>If you ever have any questions or need assistance, don't hesitate to reach out. Our contact details are available on our website. We're here to help you every step of the way!</i><br/>" +
            "<p>Happy Learning!</p>")
        .subject("Your RYD Learning Partner Account is Approved!").send().then(r => LOG_DEBUG ? console.log(r) : null);
}

// PARTNER PARENT INVITE
exports.sendParentInviteEmail = (data) => {
    new emailTemple(data.email).who("Dear Parent")
        .body("Dear Parent <br/>" +
            "<strong>You've been invited to join RYD Learning by " + data.partnerName + ", a trusted partner of our platform.</strong><br/>" +
            "<p>RYD Learning offers engaging and interactive coding programs designed to spark your child's curiosity and develop essential computer skills.</p><br/>" +
            "<p>By joining RYD Learning, you'll gain access to: </p><br/>" +
            "<strong>High-quality coding courses:</strong> Our carefully curated curriculum provides a fun and engaging learning experience.<br/>" +
            "<strong>Expert instructors:</strong> Benefit from the guidance of experienced educators who are passionate about teaching coding.<br/>" +
            "<strong>A supportive community:</strong> Connect with other parents and students in our vibrant community.<br/>" +
            "<strong>To accept this invitation and create an account for your child, please click on the following link:</strong><br/>" +
            `<strong><a href="https://partners.rydlearning.com/partner/parent/register?partnerID=${data.patnerId}">Click here</a></strong><br/>` +
            "<p>We look forward to welcoming you and your child to the RYD Learning family! </p><br/>" +
            "<i>If you ever have any questions or need assistance, don't hesitate to reach out. Our contact details are available on our website. We're here to help you every step of the way!</i><br/>" +
            "<p>Happy Learning!</p>")
        .subject("Invitation to Join RYD Learning").send().then(r => LOG_DEBUG ? console.log(r) : null);
}


////////////////////////////////////////////////////////////////
// PROMO
////////////////////////////////////////////////////////////////

// PROMO WELCOME MESSAGE
exports.sendPromoProgramWelcomeEmail = (data) => {
    new emailTemple(data.email).who(data.firstName)
        .body("Dear " + data.firstName + "<br/>" +
            "<strong>Welcome to RYD Learning! We're excited to give you access to your promo creation account.</strong><br/>" +
            "<p>This account grants you the power to create and share engaging promotional campaigns to help spread the word about our innovative coding programs for young learners.</p><br/>" +
            "<strong>Here's how you can leverage your promo creation account:</strong><br/>" +
            "<ul>" +
            "<li><strong>Craft compelling promotional materials:** Design eye-catching flyers, social media posts, and email templates to attract new students.</li>" +
            "<li><strong>Track your campaign performance:** Monitor the impact of your promos with detailed analytics and reporting tools.</li>" +
            "<li><strong>Customize your message:** Tailor your promotions to resonate with specific audiences and reach the right potential students.</li>" +
            "</ul>" +
            "<p>By utilizing your promo creation account, you'll be instrumental in helping RYD Learning reach a wider audience and inspire the next generation of coding enthusiasts.</p><br/>" +
            "<strong>Get started now!</strong><br/>" +
            "<ol>" +
            `<li>Visit our website: <strong><a href="http://localhost:5173/promo/parent/login">Click here</a></strong></li>` +
            "<li>Log in using your email and this provided details <strong>" + data.password + "</strong>.</li>" +
            "<li>Explore the intuitive tools and unleash your creativity to build impactful promotions.</li>" +
            "</ol>" +
            "<i>If you ever have any questions or need assistance, don't hesitate to reach out. Our contact details are available on our website. We're here to help you every step of the way!</i><br/>" +
            "<p>Happy Learning!</p>")
        .subject("Welcome to the RYD Learning Promo Program!").send().then(r => LOG_DEBUG ? console.log(r) : null);
}

exports.sendParentPromoWelcomeEmail = (data) => {
    new emailTemple(data.email).who(data.firstName)
        .body("Dear " + data.firstName + "<br/>" +
            "<strong>Welcome to RYD Learning! We're excited you joined through our promo program.</strong><br/>" +
            "<p>Get ready to unlock your child's potential in the exciting world of coding!  This special program gives your child access to engaging lessons and activities designed to spark a lifelong love of learning.</p><br/>" +
            "<p>Here's what makes the promo program special:</p><br/>" +
            "<strong>Exclusive Benefits:** Take advantage of [List specific benefits of the promo program, e.g., discounted pricing, bonus access to resources, early enrollment].</strong><br/>" +
            "<p>Here's what your child can expect:</p><br/>" +
            "<strong>Fun & Engaging Learning:** Interactive lessons and projects that make coding fun and accessible.</strong><br/>" +
            "<strong>Skill Development:** Watch your child develop problem-solving skills, critical thinking, and creativity through coding challenges.</strong><br/>" +
            "<strong>Supportive Community:** Connect with other parents and families on their coding journey.</strong><br/>" +
            "<p>Ready to unleash your child's inner coder? Head over to your account and explore the exciting promo program options!</p><br/>" +
            "<i>Don't hesitate to reach out if you have any questions or need help getting started. Our dedicated support team is here for you! Contact details are available on our website.</i><br/>" +
            "<p>Happy Coding Adventures!</p>")
        .subject("Welcome to RYD Learning's Promo Program!").send().then(r => LOG_DEBUG ? console.log(r) : null);
}


exports.sendParentPromoReminderEmail = (data) => {
    new emailTemple(data.email).who("Parent")
        .body("Dear "+data.name+"<br/><br/>" +
            "<strong>Congratulations, "+data.child+" made it to our 2 days free coding class.</strong><br/><br/>" +
            "<p> "+data.child+" have been scheduled to attend their 2 days class on " + data.time + ". We're excited to have them join us to experience first hand what RYDLearning stands for.</p><br/>" +
            "<strong>To access the class, please follow these simple steps:</strong><br/>" +
            "<p>1. Please login by <a href='https://promo.rydlearning.com/promo/parent/login'>Clicking here</a></p><br/>" +
            "<p>2. Beside your child’s name you will see the option “Go to Class” Click on it. This will redirect you to a meeting link </p><br/>" +
            "<p>3. Click to Ask to join and a teacher will be waiting to accept your child into the class</p><br/><br/>" +
            "<strong>Here are a few details to get you ready for class:</strong><br/>" +
            "<p>1. Please ensure your child is ready with any necessary materials or equipment for the session (Laptop, Pen and Book).</p><br/>" +
            "<p>2. Ensure Your Child is Well-Seated in Class and Ready to Learn.</p><br/><br/>" +
            "<strong>*Summary of class*</strong><br/>" +
            "<p>Date/Time: " + data.time + "</p><br/>" +
            "<p>Teacher Name: " + data.teacher + " </p><br/>" +
            "<p>You can also join the class directly using the below link: " + data.link + "</p><br/><br/>" +
            "<i>Technical Support: If your child has a special need or you encounter any technical difficulties that require assistance during the class please let us know, so we can prepare for it. Our support team is available to help. You can reach out to learning@rydlearning.com or call +18337371275 for prompt assistance.</i><br/>")
        .subject("Free 2 Days Coding Event").send().then(r => LOG_DEBUG ? console.log(r) : null);
}

exports.sendParentPromoCertificateEmail = (data) => {
    new emailTemple(data.email).who("Parent")
        .body("Dear " + data.name + "<br/><br/>" +
            "<strong>Congratulations! " + data.child + " successfully completed our 2-day free coding class.</strong><br/><br/>" +
            "<p>We are excited to let you know that your child's certificate is now ready for download!</p><br/>" +
            "<strong>To download the certificate, please follow these simple steps:</strong><br/>" +
            "<p>* Please <a href='https://parent.rydlearning.com/parent/certificate/download/"+data.id+"'>Click here</a> to download your certificate.</p><br/> <br/>" +
            "<p>The certificate will be available for download in PDF format.</p><br/><br/>" +
            "<i>If you encounter any issues or need assistance with downloading the certificate, feel free to reach out to our support team at learning@rydlearning.com or call +18337371275.</i><br/><br/>" +
            "<strong>Thank you for allowing us to be part of your child's learning journey!</strong><br/>")
        .subject("Your Child's Coding Class Certificate is Ready to Download").send().then(r => LOG_DEBUG ? console.log(r) : null);
}
