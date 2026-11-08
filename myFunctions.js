// ننتظر حتى يتم تحميل الصفحة بالكامل قبل تنفيذ أي كود
$(document).ready(function() {

    // ==========================================
    // 1. إظهار وإخفاء تفاصيل السيارة باستخدام jQuery
    // ==========================================
    $('.details-checkbox').change(function() {
        // الحصول على الـ id الخاص بصف التفاصيل المرتبط بهذا المربع
        var targetId = $(this).attr('data-target');
        
        // إذا تم تحديد المربع، أظهر التفاصيل، وإلا أخفها
        if ($(this).is(':checked')) {
            $('#' + targetId).slideDown(); // تأثير الانزلاق للأسفل
        } else {
            $('#' + targetId).slideUp(); // تأثير الانزلاق للأعلى
        }
    });

    // ==========================================
    // 2. إظهار نموذج الحجز عند الضغط على "متابعة" (يسمح بأكثر من سيارة)
    // ==========================================
    $('#continueBtn').click(function() {
        // التحقق من عدد السيارات المختارة
        var selectedCars = $('.select-checkbox:checked');
        
        if (selectedCars.length === 0) {
            alert('الرجاء اختيار سيارة واحدة على الأقل للمتابعة.');
            return; // إيقاف التنفيذ إذا لم يتم اختيار أي سيارة
        }

        // إظهار نموذج الحجز بحركة انزلاق
        $('#bookingFormContainer').slideDown();
        
        // التمرير إلى النموذج لرؤيته
        $('html, body').animate({
            scrollTop: $("#bookingFormContainer").offset().top
        }, 500);
    });

    // ==========================================
    // 3. التحقق من صحة النموذج عند الإرسال (Validation)
    // ==========================================
    $('#bookingForm').submit(function(event) {
        event.preventDefault(); // منع إرسال النموذج بالطريقة التقليدية
        
        var isValid = true; // متغير لتتبع حالة النموذج

        // إخفاء جميع رسائل الخطأ في البداية
        $('.error-msg').hide();

        // --- أ. التحقق من الاسم (أحرف عربية فقط) ---
        var name = $('#fullName').val().trim();
        var arabicRegex = /^[\u0600-\u06FF\s]+$/; // تعبير نمطي للأحرف العربية والمسافات
        if (name === '' || !arabicRegex.test(name)) {
            $('#nameError').show();
            isValid = false;
        }

        // --- ب. التحقق من الرقم الوطني (11 خانة، يبدأ من 01 إلى 14) ---
        var nationalId = $('#nationalId').val().trim();
        // التعبير النمطي: يبدأ بـ 01 أو 02 ... حتى 14، ويتبعه 9 أرقام (المجموع 11)
        var idRegex = /^(0[1-9]|1[0-4])[0-9]{9}$/; 
        if (!idRegex.test(nationalId)) {
            $('#idError').text('يجب أن يكون الرقم الوطني 11 خانة ويبدأ بـ 01 إلى 14.').show();
            isValid = false;
        }

        // --- ج. التحقق من التواريخ ---
        var startDateVal = $('#startDate').val();
        var endDateVal = $('#endDate').val();

        if (startDateVal === '') {
            $('#startDateError').text('الرجاء اختيار تاريخ البداية.').show();
            isValid = false;
        }

        if (endDateVal === '') {
            $('#endDateError').text('الرجاء اختيار تاريخ النهاية.').show();
            isValid = false;
        } else if (startDateVal !== '' && endDateVal !== '') {
            var startDate = new Date(startDateVal);
            var endDate = new Date(endDateVal);
            if (endDate <= startDate) {
                $('#endDateError').text('تاريخ النهاية يجب أن يكون بعد تاريخ البداية.').show();
                isValid = false;
            }
        }

        // --- د. التحقق من رقم الموبايل (Syriatel أو MTN) ---
        var mobile = $('#mobileNumber').val().trim();
        // التعبير النمطي: يبدأ بـ 094, 096, 098 (MTN) أو 093, 095 (Syriatel) ويتبعه 6 أرقام (المجموع 10)
        var mobileRegex = /^(094|096|098|093|095)[0-9]{6}$/; 
        if (!mobileRegex.test(mobile)) {
            $('#mobileError').text('رقم الموبايل يجب أن يبدأ بـ 094,096,098 (MTN) أو 093,095 (Syriatel) ويتكون من 10 أرقام.').show();
            isValid = false;
        }

        // --- هـ. التحقق من البريد الإلكتروني ---
        var email = $('#email').val().trim();
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            $('#emailError').show();
            isValid = false;
        }

        // ==========================================
        // 4. إذا كان النموذج صحيحاً، احسب المبلغ لجميع السيارات المختارة وأظهر النجاح
        // ==========================================
        if (isValid) {
            // حساب عدد الأيام
            var start = new Date(startDateVal);
            var end = new Date(endDateVal);
            var timeDiff = end.getTime() - start.getTime();
            var days = Math.ceil(timeDiff / (1000 * 3600 * 24)); // تحويل الفارق الزمني إلى أيام

            var totalPricePerDay = 0; // مجموع أسعار السيارات في اليوم الواحد
            var selectedCarsDetails = ""; // لتجميع أسماء السيارات المختارة

            // المرور على كل سيارة مختارة وجمع سعرها
            $('.select-checkbox:checked').each(function() {
                var carCode = $(this).val();
                var carPrice = parseInt($(this).attr('data-price'));
                totalPricePerDay += carPrice;
                
                // إضافة اسم السيارة لرسالة النجاح
                selectedCarsDetails += "- السيارة: " + carCode + "<br>";
            });

            // حساب الإجمالي (سعر السيارات مجتمعة × عدد الأيام)
            var totalPrice = totalPricePerDay * days;
            var discountMsg = "";

            // تطبيق خصم 5% إذا تجاوزت المدة 10 أيام
            if (days > 10) {
                var discount = totalPrice * 0.05;
                totalPrice = totalPrice - discount;
                discountMsg = " (تم تطبيق خصم 5% لأن مدة التأجير تجاوزت 10 أيام)";
            }

            // إظهار رسالة النجاح مع تفاصيل الحجز
            var successHtml = "تم تأكيد حجزك بنجاح!<br><br>" +
                              "<strong>السيارات المحجوزة:</strong><br>" + selectedCarsDetails + "<br>" +
                              "عدد أيام التأجير: " + days + " أيام<br>" +
                              "المبلغ الإجمالي المطلوب: " + totalPrice.toLocaleString() + " ل.س" + discountMsg;
            
            $('#successMessage').html(successHtml).fadeIn();
            
            // تعطيل زر الإرسال لمنع الإرسال المتكرر
            $('#submitBooking').prop('disabled', true).text('تم الحجز');
        }
    });

});