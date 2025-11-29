using NUnit.Framework;
using UnityEngine;
using Koconi.Model;

namespace Koconi.Tests
{
    public class APIServiceTest
    {
        [Test]
        public void TestJsonParsing()
        {
            string json = "{\"success\":true,\"message\":\"OK\",\"data\":{\"id\":\"123\",\"username\":\"test\"}}";
            var response = JsonUtility.FromJson<ApiResponse<User>>(json);

            Assert.IsTrue(response.success);
            Assert.AreEqual("OK", response.message);
            Assert.AreEqual("123", response.data.id);
            Assert.AreEqual("test", response.data.username);
        }

        [Test]
        public void TestPinParsing()
        {
            string json = "{\"id\":\"1\",\"latitude\":35.6,\"longitude\":139.7,\"title\":\"Test Pin\"}";
            var pin = JsonUtility.FromJson<Pin>(json);

            Assert.AreEqual("1", pin.id);
            Assert.AreEqual(35.6, pin.latitude, 0.001);
            Assert.AreEqual("Test Pin", pin.title);
        }
    }
}
