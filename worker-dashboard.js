function acceptJobWithPayment(jobId) {

  var options = {
    key: "rzp_test_RpThhbCgf6NNn7",
    amount: 5000,
    currency: "INR",
    name: "Seva Care",
    description: "Job Accept Fee",

    handler: function (response) {
      alert("Payment Successful");

      firebase.firestore().collection("jobs").doc(jobId).update({
        status: "accepted",
        paymentId: response.razorpay_payment_id
      }).then(() => {
        alert("Job Accepted Successfully");
      });
    }
  };

  var rzp = new Razorpay(options);
  rzp.open();
            }
