package com.barakah.app;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(NativeCompassPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
