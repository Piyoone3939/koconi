using UnityEngine;
using Koconi.Model;

namespace Koconi.View
{
    public class PinView : MonoBehaviour
    {
        public Pin PinData { get; private set; }

        public void Setup(Pin pin)
        {
            PinData = pin;
            // Load photo or set icon
        }

        public void OnClick()
        {
            // Notify ViewManager to show details
            Debug.Log($"Clicked pin: {PinData.title}");
            // FindObjectOfType<ViewManager>().ShowPinDetail(PinData);
        }
    }
}
